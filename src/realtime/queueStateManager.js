/**
 * Gestor de estado para consolidar métricas de las colas.
 */
class QueueStateManager {
    constructor() {
        this.queues = new Map();
    }

    /**
     * Obtiene o inicializa el estado de una cola.
     */
    getQueueState(numero_cola) {
        if (!this.queues.has(numero_cola)) {
            this.queues.set(numero_cola, {
                numero_cola,
                llamadas_espera: 0,
                llamadas_activas: 0,
                agentes_disponibles: 0,
                agentes_ocupados: 0,
                lastUpdate: new Date()
            });
        }
        return this.queues.get(numero_cola);
    }

    /**
     * Actualiza métricas específicas de una cola.
     */
    updateQueue(numero_cola, metrics) {
        const currentState = this.getQueueState(numero_cola);
        const updatedState = { ...currentState, ...metrics, lastUpdate: new Date() };
        this.queues.set(numero_cola, updatedState);
        return updatedState;
    }

    /**
     * Obtiene todos los estados de las colas.
     */
    getAllQueues() {
        return Array.from(this.queues.values());
    }
}

module.exports = new QueueStateManager();
