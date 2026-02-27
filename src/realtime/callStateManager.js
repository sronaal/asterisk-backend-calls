/**
 * Gestor de estado para las llamadas activas en el sistema.
 * Mantiene en memoria la información de cada llamada desde que entra hasta que cuelga.
 */
class CallStateManager {
    constructor() {
        this.activeCalls = new Map();
    }

    /**
     * Registra o actualiza una llamada.
     */
    updateCall(linkedid, data) {
        const existingCall = this.activeCalls.get(linkedid) || {
            linkedid,
            estado: 'RINGING',
            numero_origen: '',
            destino: '',
            cola: null,
            agente: null,
            inicio_llamada: new Date(),
            inicio_espera: null,
            inicio_conversacion: null,
            timestamp: new Date().toISOString()
        };

        const updatedCall = { ...existingCall, ...data, lastUpdate: new Date() };
        this.activeCalls.set(linkedid, updatedCall);
        return updatedCall;
    }

    /**
     * Elimina una llamada finalizada.
     */
    removeCall(linkedid) {
        const call = this.activeCalls.get(linkedid);
        if (call) {
            this.activeCalls.delete(linkedid);
        }
        return call;
    }

    /**
     * Obtiene una llamada por su ID.
     */
    getCall(linkedid) {
        return this.activeCalls.get(linkedid);
    }

    /**
     * Obtiene todas las llamadas activas.
     */
    getAllCalls() {
        return Array.from(this.activeCalls.values());
    }

    /**
     * Formatea el tiempo en segundos a HH:MM:SS
     */
    formatDuration(seconds) {
        return new Date(seconds * 1000).toISOString().substr(11, 8);
    }
}

module.exports = new CallStateManager();
