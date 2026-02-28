const { Server } = require("socket.io")
const { getLicenseStatus } = require("../core/license/licenseValidator")
class SocketService {

    constructor() {
        this.io = null
    }


    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Namespace dedicado para monitoreo en tiempo real
        this.realtime = this.io.of("/realtime");

        this.realtime.on('connection', (socket) => {
            const status = getLicenseStatus();
            socket.emit('license_status', status);

            if (!status.valid || status.expired) {
                socket.emit('license_expired', status);
            }

            // Podríamos emitir el estado actual al conectar
            socket.emit('auth:success', { connected: true });
        });
    }

    /**
     * Emite un evento a todos los clientes en el namespace /realtime
     */
    emit(event, data) {
        if (this.realtime) {
            const status = getLicenseStatus();

            // Si la licencia no es válida o está expirada, bloqueamos eventos de monitoreo
            if (!status.valid || status.expired) {
                // Solo permitimos eventos relacionados con el sistema de licencia
                if (event !== 'license_status' && event !== 'license_expired') {
                    return;
                }
            }

            this.realtime.emit(event, data);
        }
    }
}

const socketService = new SocketService();
module.exports = socketService;