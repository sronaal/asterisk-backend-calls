const { Server } = require("socket.io")
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
            console.log('Cliente conectado al namespace /realtime');

            // Podríamos emitir el estado actual al conectar
            socket.emit('auth:success', { connected: true });
        });
    }

    /**
     * Emite un evento a todos los clientes en el namespace /realtime
     */
    emit(event, data) {
        if (this.realtime) {
            this.realtime.emit(event, data);
        }
    }
}

const socketService = new SocketService();
module.exports = socketService;