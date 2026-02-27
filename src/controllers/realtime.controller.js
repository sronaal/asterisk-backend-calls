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
