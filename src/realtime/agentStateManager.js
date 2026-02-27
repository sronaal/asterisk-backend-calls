/**
 * Gestor de estado para los agentes registrados en las colas.
 */
class AgentStateManager {
    constructor() {
        this.agents = new Map();
    }

    /**
     * Actualiza el estado o información de un agente.
     */
    updateAgent(extension, data) {
        const existingAgent = this.agents.get(extension) || {
            extension,
            nombre: `Agente ${extension}`,
            estado: 'OFFLINE',
            colas: new Set(),
            llamada_actual: null,
            ultima_conexion: new Date()
        };

        const updatedAgent = { ...existingAgent, ...data };

        // Manejo especial para colas (siendo un Set)
        if (data.addCola) updatedAgent.colas.add(data.addCola);
        if (data.removeCola) updatedAgent.colas.delete(data.removeCola);

        this.agents.set(extension, updatedAgent);
        return updatedAgent;
    }

    /**
     * Obtiene todos los agentes y sus estados.
     */
    getAllAgents() {
        return Array.from(this.agents.values()).map(agent => ({
            ...agent,
            colas: Array.from(agent.colas) // Convertir Set a Array para JSON
        }));
    }

    /**
     * Obtiene un agente específico.
     */
    getAgent(extension) {
        return this.agents.get(extension);
    }
}

module.exports = new AgentStateManager();
