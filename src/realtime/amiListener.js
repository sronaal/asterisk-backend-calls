const amiService = require('../services/AMI');
const socketService = require('../services/socket.service');
const callStateManager = require('./callStateManager');
const agentStateManager = require('./agentStateManager');
const queueStateManager = require('./queueStateManager');

const getAgentStateFromStatus = (status) => {
    const strStatus = String(status);
    if (strStatus === '1') return 'LIBRE';
    if (['2', '3', '6', '7', '8'].includes(strStatus)) return 'OCUPADO';
    return 'OFFLINE';
};

const normalizeAgentId = (id) => {
    if (!id) return id;
    // Caso: PJSIP/501-000001 -> 501
    // Caso: Local/501@from-queue-0001;1 -> 501
    const match = id.match(/(?:PJSIP|SIP|Local)\/([^@\-;]+)/i);
    return match ? match[1] : id;
};

/**
 * Escuchador central de eventos AMI para normalizar datos y actualizar estados.
 */
class AMIListener {
    init() {
        if (!amiService.ami) {
            console.error("AMI Service no inicializado. No se puede iniciar AMIListener.");
            return;
        }

        const ami = amiService.ami;

        // --- CARGA INICIAL DE ESTADOS ---
        // Solicita el estado actual de las colas para poblar agentes ya logueados
        ami.action({
            'action': 'QueueStatus'
        }, (err, res) => {
            if (err) console.error("Error pidiendo QueueStatus inicial:", err);
        });

        // Solicitar canales activos (Llamadas ya en curso al encender Node)
        ami.action({
            'action': 'CoreShowChannels'
        }, (err, res) => {
            if (err) console.error("Error pidiendo CoreShowChannels inicial:", err);
        });

        // Evento lanzado en respuesta a QueueStatus
        ami.on('queuemember', (evt) => {
            const memberExt = evt.name || evt.membername;
            if (!memberExt) return;

            const agentId = normalizeAgentId(memberExt);
            const estadoCalculado = getAgentStateFromStatus(evt.status);

            agentStateManager.updateAgent(agentId, {
                nombre: evt.membername || agentId,
                estado: estadoCalculado,
                addCola: evt.queue
            });
            this.broadcastQueueUpdate(evt.queue);
        });

        // Evento listando canales ya vivos en Asterisk
        ami.on('coreshowchannel', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;
            if (evt.linkedid && evt.uniqueid !== evt.linkedid) return; // Solo canales root

            let tipo = 'IVR';
            if (evt.application === 'Queue') tipo = 'COLA';
            else if (evt.application === 'Dial') tipo = 'EXT <-> EXT';

            let estado = 'CONNECTED';
            if (evt.channelstatedesc === 'Ringing' || evt.channelstatedesc === 'Ring') estado = 'RINGING';

            callStateManager.updateCall(callId, {
                numero_origen: evt.calleridnum || evt.callerid,
                destino: evt.exten,
                estado: estado,
                tipo_llamada: tipo,
                inicio_llamada: evt.duration ? new Date(Date.now() - (parseInt(evt.duration) * 1000)) : new Date()
            });
        });

        // --- EVENTOS DE LLAMADA ---

        // Nueva llamada
        ami.on('newchannel', (evt) => {

            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            let tipoLlamada = 'IVR / INTRANET';
            if (evt.exten && evt.exten.length <= 4 && evt.calleridnum && evt.calleridnum.length <= 4) {
                tipoLlamada = 'EXT <-> EXT';
            }

            const call = callStateManager.updateCall(callId, {
                numero_origen: evt.calleridnum || evt.callerid,
                destino: evt.exten,
                estado: 'RINGING',
                tipo_llamada: tipoLlamada
            });

            socketService.emit('call:ringing', {
                linkedid: call.linkedid,
                numero_origen: call.numero_origen,
                destino: call.destino,
                tipo_llamada: call.tipo_llamada,
                timestamp: call.timestamp
            });
        });

        // Entrada a Cola
        ami.on('queuecallerjoin', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.updateCall(callId, {
                cola: evt.queue,
                estado: 'WAITING',
                tipo_llamada: 'COLA',
                inicio_espera: new Date()
            });

            socketService.emit('call:queue:join', {
                linkedid: call.linkedid,
                cola: call.cola,
                tipo_llamada: call.tipo_llamada,
                timestamp: new Date().toISOString()
            });

            this.broadcastQueueUpdate(evt.queue);
        });

        // Agente Conecta (Llamada contestada en cola)
        ami.on('agentconnect', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.updateCall(callId, {
                agente: normalizeAgentId(evt.membername || evt.connectedlinename || evt.interface),
                cola: callStateManager.getCall(callId)?.cola || evt.queue,
                estado: 'CONNECTED',
                inicio_conversacion: new Date()
            });

            if (call.agente) {
                agentStateManager.updateAgent(call.agente, {
                    estado: 'OCUPADO',
                    llamada_actual: callId
                });
            }

            socketService.emit('call:answered', {
                linkedid: call.linkedid,
                cola: call.cola,
                agente: call.agente,
                timestamp: new Date().toISOString()
            });

            if (call.agente) this.broadcastAgentQueuesUpdate(call.agente);
            else if (call.cola) this.broadcastQueueUpdate(call.cola);
        });

        // Llamada Contestada (Bridge general para llamadas directas o sin cola)
        ami.on('bridge', (evt) => {
            if (evt.bridgestate !== 'Link') return; // Solo procesar cuando se unen

            const callId = evt.linkedid || evt.uniqueid1 || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.getCall(callId);
            if (!call || call.estado === 'CONNECTED') return; // Si ya se procesó por agentconnect ignorar

            const agenteRaw = evt.callerid2 || evt.connectedlinename;
            const agentId = normalizeAgentId(call.agente || agenteRaw);

            const updatedCall = callStateManager.updateCall(callId, {
                agente: agentId,
                estado: 'CONNECTED',
                inicio_conversacion: call.inicio_conversacion || new Date()
            });

            if (updatedCall.agente) {
                agentStateManager.updateAgent(updatedCall.agente, {
                    estado: 'OCUPADO',
                    llamada_actual: callId
                });
            }

            socketService.emit('call:answered', {
                linkedid: updatedCall.linkedid,
                cola: updatedCall.cola,
                agente: updatedCall.agente,
                timestamp: new Date().toISOString()
            });

            if (updatedCall.agente) this.broadcastAgentQueuesUpdate(updatedCall.agente);
            else if (updatedCall.cola) this.broadcastQueueUpdate(updatedCall.cola);
        });

        ami.on('bridgeenter', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.getCall(callId);
            if (!call || call.estado === 'CONNECTED') return;

            const agentId = normalizeAgentId(call.agente || evt.calleridnum);

            const updatedCall = callStateManager.updateCall(callId, {
                agente: agentId,
                estado: 'CONNECTED',
                inicio_conversacion: call.inicio_conversacion || new Date()
            });

            if (updatedCall.agente) {
                agentStateManager.updateAgent(updatedCall.agente, {
                    estado: 'OCUPADO',
                    llamada_actual: callId
                });
            }

            socketService.emit('call:answered', {
                linkedid: updatedCall.linkedid,
                cola: updatedCall.cola,
                agente: updatedCall.agente,
                timestamp: new Date().toISOString()
            });

            if (updatedCall.agente) this.broadcastAgentQueuesUpdate(updatedCall.agente);
            else if (updatedCall.cola) this.broadcastQueueUpdate(updatedCall.cola);
        });

        // Fin de llamada
        ami.on('hangup', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            // BUG FIX (GHOST AGENT): Liberar al agente que cuelga su canal, sin importar si es la llamada principal o no.
            const channelAgentId = normalizeAgentId(evt.channel);
            const agent = agentStateManager.getAgent(channelAgentId);

            // Si el que colgó es un agente que estaba en esta llamada, lo liberamos
            if (agent && (agent.llamada_actual === callId || agent.estado === 'OCUPADO')) {
                agentStateManager.updateAgent(channelAgentId, {
                    estado: 'LIBRE',
                    llamada_actual: null
                });
                this.broadcastAgentQueuesUpdate(channelAgentId);
            }

            // PREVENCIÓN DE BUG: No eliminar la llamada si el canal que se colgó es un canal secundario (ej. Dummy channel de Dial/MoH).
            if (evt.linkedid && evt.uniqueid !== evt.linkedid) {
                return;
            }

            const call = callStateManager.getCall(callId);
            if (call) {
                const duracion_total = Math.round((new Date() - call.inicio_llamada) / 1000);
                const exAgenteId = normalizeAgentId(call.agente);

                if (exAgenteId) {
                    agentStateManager.updateAgent(exAgenteId, {
                        estado: 'LIBRE',
                        llamada_actual: null
                    });
                }

                socketService.emit('call:hangup', {
                    linkedid: call.linkedid,
                    estado_final: evt.cause_txt || 'FINISHED',
                    duracion_total: callStateManager.formatDuration(duracion_total)
                });

                callStateManager.removeCall(callId);

                if (exAgenteId) this.broadcastAgentQueuesUpdate(exAgenteId);
                else if (call.cola) this.broadcastQueueUpdate(call.cola);
            }
        });

        // --- EVENTOS DE AGENTES ---

        // Login / Miembro añadido a cola
        ami.on('queuememberadded', (evt) => {
            const agentId = normalizeAgentId(evt.membername);
            const agent = agentStateManager.updateAgent(agentId, {
                nombre: evt.membername || agentId,
                estado: getAgentStateFromStatus(evt.status),
                addCola: evt.queue
            });

            // Emitimos snapshot parcial del agente con su nueva lista de colas
            socketService.emit('agent:update', agentStateManager.getAllAgents().find(a => a.extension_agente === agentId));
            this.broadcastAgentQueuesUpdate(agentId);
        });

        // Logout / Miembro removido de cola
        ami.on('queuememberremoved', (evt) => {
            const agentId = normalizeAgentId(evt.membername);
            const agent = agentStateManager.updateAgent(agentId, {
                removeCola: evt.queue
            });

            // Emitimos actualización para borrar colas de la UI
            const fullAgent = agentStateManager.getAllAgents().find(a => a.extension_agente === agentId);
            socketService.emit('agent:update', fullAgent || { extension_agente: agentId, estado: 'OFFLINE', colas: [] });
            this.broadcastAgentQueuesUpdate(agentId);
        });

        // Cambio de estado de agente
        ami.on('queuememberstatus', (evt) => {
            const agentId = normalizeAgentId(evt.membername);
            const agent = agentStateManager.getAgent(agentId);

            // FIX: Si el agente no está logueado en ninguna cola localmente, ignoramos sus cambios de estado técnicos.
            if (!agent || !agent.colas || agent.colas.size === 0) {
                return;
            }

            const estado = getAgentStateFromStatus(evt.status);

            agentStateManager.updateAgent(agentId, {
                estado: estado
            });

            socketService.emit('agent:status-change', {
                extension_agente: agentId,
                estado: estado,
                timestamp: new Date().toISOString()
            });

            this.broadcastAgentQueuesUpdate(agentId);
        });

        // Timer global de 1 segundo
        setInterval(() => {
            this.processPeriodicUpdates();
        }, 1000);
    }

    /**
     * Procesa actualizaciones de tiempo para llamadas en espera y en conversación.
     */
    processPeriodicUpdates() {
        const activeCalls = callStateManager.getAllCalls();
        const now = new Date();

        activeCalls.forEach(call => {
            if (call.estado === 'WAITING' && call.inicio_espera) {
                const waitSecs = Math.round((now - call.inicio_espera) / 1000);
                socketService.emit('call:queue:waiting', {
                    linkedid: call.linkedid,
                    numero_cola: call.cola,
                    tiempo_espera: callStateManager.formatDuration(waitSecs)
                });
            } else if (call.estado === 'CONNECTED' && call.inicio_conversacion) {
                const talkSecs = Math.round((now - call.inicio_conversacion) / 1000);
                socketService.emit('call:in-progress', {
                    linkedid: call.linkedid,
                    agente: call.agente,
                    tiempo_conversacion: callStateManager.formatDuration(talkSecs)
                });
            }
        });
    }

    /**
     * Calcula y emite un snapshot del estado de una cola específica.
     */
    broadcastQueueUpdate(queueNum) {
        if (!queueNum) return;
        const calls = callStateManager.getAllCalls();
        const agents = agentStateManager.getAllAgents();

        const waiting = calls.filter(c => c.cola === queueNum && c.estado === 'WAITING').length;
        const active = calls.filter(c => c.cola === queueNum && c.estado === 'CONNECTED').length;

        const queueAgents = agents.filter(a => a.colas.includes(queueNum));
        const available = queueAgents.filter(a => a.estado === 'LIBRE').length;
        const busy = queueAgents.filter(a => a.estado === 'OCUPADO').length;

        const snapshot = queueStateManager.updateQueue(queueNum, {
            llamadas_espera: waiting,
            llamadas_activas: active,
            agentes_disponibles: available,
            agentes_ocupados: busy
        });

        socketService.emit('queue:update', snapshot);
    }

    /**
     * Actualiza todas las colas a las que pertenece un agente.
     * Esencial cuando el agente se ocupa, ya que afecta las métricas de todas sus colas.
     */
    broadcastAgentQueuesUpdate(extension) {
        if (!extension) return;
        const agent = agentStateManager.getAgent(extension);
        if (agent && agent.colas) {
            agent.colas.forEach(queueNum => this.broadcastQueueUpdate(queueNum));
        }
    }
}

module.exports = new AMIListener();
