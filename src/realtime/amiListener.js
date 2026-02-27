const amiService = require('../services/AMI');
const socketService = require('../services/socket.service');
const callStateManager = require('./callStateManager');
const agentStateManager = require('./agentStateManager');
const queueStateManager = require('./queueStateManager');

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

        // --- EVENTOS DE LLAMADA ---

        // Nueva llamada
        ami.on('newchannel', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.updateCall(callId, {
                numero_origen: evt.calleridnum || evt.callerid,
                destino: evt.exten,
                estado: 'RINGING'
            });

            socketService.emit('call:ringing', {
                linkedid: call.linkedid,
                numero_origen: call.numero_origen,
                destino: call.destino,
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
                inicio_espera: new Date()
            });

            socketService.emit('call:queue:join', {
                linkedid: call.linkedid,
                numero_cola: call.cola,
                timestamp: new Date().toISOString()
            });

            this.broadcastQueueUpdate(evt.queue);
        });

        // Agente Conecta (Llamada contestada)
        ami.on('agentconnect', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.updateCall(callId, {
                agente: evt.membername || evt.connectedlinename,
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
                numero_cola: call.cola,
                agente: call.agente,
                timestamp: new Date().toISOString()
            });

            if (call.cola) this.broadcastQueueUpdate(call.cola);
        });

        // Fin de llamada
        ami.on('hangup', (evt) => {
            const callId = evt.linkedid || evt.uniqueid;
            if (!callId) return;

            const call = callStateManager.getCall(callId);
            if (call) {
                const duracion_total = Math.round((new Date() - call.inicio_llamada) / 1000);

                if (call.agente) {
                    agentStateManager.updateAgent(call.agente, {
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
                if (call.cola) this.broadcastQueueUpdate(call.cola);
            }
        });

        // --- EVENTOS DE AGENTES ---

        // Login / Miembro añadido a cola
        ami.on('queuememberadded', (evt) => {
            agentStateManager.updateAgent(evt.membername, {
                nombre: evt.membername,
                estado: evt.status === '1' ? 'LIBRE' : 'OCUPADO',
                addCola: evt.queue
            });

            socketService.emit('agent:login', {
                extension_agente: evt.membername,
                cola: evt.queue,
                timestamp: new Date().toISOString()
            });

            this.broadcastQueueUpdate(evt.queue);
        });

        // Logout / Miembro removido de cola
        ami.on('queuememberremoved', (evt) => {
            agentStateManager.updateAgent(evt.membername, {
                removeCola: evt.queue
            });

            socketService.emit('agent:logout', {
                extension_agente: evt.membername,
                cola: evt.queue,
                timestamp: new Date().toISOString()
            });

            this.broadcastQueueUpdate(evt.queue);
        });

        // Cambio de estado de agente
        ami.on('queuememberstatus', (evt) => {
            const estado = (evt.status === '1') ? 'LIBRE' : 'OCUPADO';

            agentStateManager.updateAgent(evt.membername, {
                estado: estado
            });

            socketService.emit('agent:status-change', {
                extension_agente: evt.membername,
                estado: estado,
                timestamp: new Date().toISOString()
            });

            this.broadcastQueueUpdate(evt.queue);
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
     * Calcula y emite un snapshot del estado de una cola.
     */
    broadcastQueueUpdate(queueNum) {
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
}

module.exports = new AMIListener();
