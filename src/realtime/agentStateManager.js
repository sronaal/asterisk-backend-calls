const { getLicenseStatus } = require("../core/license/licenseValidator");
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
        const existingAgent = this.agents.get(extension);

        if (!existingAgent) {
            // Validar límite de agentes antes de crear uno nuevo
            const status = getLicenseStatus();
            if (this.getAllAgents().length >= status.agents_limit) {
                console.warn(`⛔ Límite de licencia alcanzado (${status.agents_limit} agentes). Bloqueando registro para la extensión ${extension}.`);
                return { extension_agente: extension, estado: 'BLOCKED_BY_LICENSE' };
            }
        }

        const agentData = existingAgent || {
            extension_agente: extension,
            nombre: `Agente ${extension}`,
            estado: 'OFFLINE',
            colas: new Set(),
            llamada_actual: null,
            ultima_conexion: new Date()
        };

        const updatedAgent = { ...agentData, ...data };

        // Manejo especial para colas (siendo un Set)
        if (data.addCola) {
            if (!(updatedAgent.colas instanceof Set)) {
                updatedAgent.colas = new Set(Array.isArray(updatedAgent.colas) ? updatedAgent.colas : []);
            }
            updatedAgent.colas.add(String(data.addCola));
        }

        if (data.removeCola && updatedAgent.colas instanceof Set) {
            updatedAgent.colas.delete(String(data.removeCola));
        }

        // --- FIX: Si ya no pertenece a ninguna cola, lo forzamos a OFFLINE y limpiamos datos temporales
        if (updatedAgent.colas.size === 0) {
            updatedAgent.estado = 'OFFLINE';
            updatedAgent.llamada_actual = null;
        }

        this.agents.set(extension, updatedAgent);
        return updatedAgent;
    }

    /**
     * Obtiene todos los agentes y sus estados.
     * Solo devuelve agentes que pertenecen a al menos una cola.
     */
    getAllAgents() {
        return Array.from(this.agents.values())
            .filter(agent => agent.colas && agent.colas.size > 0)
            .map(agent => ({
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
