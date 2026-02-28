const callStateManager = require('../realtime/callStateManager');
const agentStateManager = require('../realtime/agentStateManager');
const queueStateManager = require('../realtime/queueStateManager');

const getCallsSnapshot = (req, res) => {
    try {
        const calls = callStateManager.getAllCalls();
        res.status(200).json(calls);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener snapshot de llamadas", error });
    }
};

const getAgentsSnapshot = (req, res) => {
    try {
        const agents = agentStateManager.getAllAgents();
        res.status(200).json(agents);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener snapshot de agentes", error });
    }
};

const getQueuesSnapshot = (req, res) => {
    try {
        // Recalcular métricas vivas para todas las colas detectadas antes de enviar el snapshot
        const calls = callStateManager.getAllCalls();
        const agents = agentStateManager.getAllAgents();
        const knownQueues = new Set();

        // Encontrar todas las colas activas ya sea por llamadas o agentes suscritos
        calls.forEach(c => { if (c.cola) knownQueues.add(c.cola); });
        agents.forEach(a => { if (a.colas) a.colas.forEach(q => knownQueues.add(q)); });

        // Forzar actualización de cada cola detectada
        knownQueues.forEach(queueNum => {
            const waiting = calls.filter(c => c.cola === queueNum && c.estado === 'WAITING').length;
            const active = calls.filter(c => c.cola === queueNum && c.estado === 'CONNECTED').length;
            const queueAgents = agents.filter(a => a.colas.includes(queueNum));
            const available = queueAgents.filter(a => a.estado === 'LIBRE').length;
            const busy = queueAgents.filter(a => a.estado === 'OCUPADO').length;

            queueStateManager.updateQueue(queueNum, {
                llamadas_espera: waiting,
                llamadas_activas: active,
                agentes_disponibles: available,
                agentes_ocupados: busy
            });
        });

        const queues = queueStateManager.getAllQueues();
        res.status(200).json(queues);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener snapshot de colas", error });
    }
};

module.exports = {
    getCallsSnapshot,
    getAgentsSnapshot,
    getQueuesSnapshot
};
