const server = require('./app')
const config = require('./src/config/config')
const socketService = require('./src/services/socket.service')
const amiService = require('./src/services/AMI')
const amiListener = require('./src/realtime/amiListener')

// 1. Inicializar Socket.io
socketService.init(server);

// 2. Conectar a Asterisk AMI
amiService.connect();

// 3. Activar escuchador de eventos en tiempo real
amiListener.init();

server.listen(config.server.port, () => {
    console.log(`Server HTTP y Realtime Namespace (/realtime) ON: ${config.server.port}`)
})