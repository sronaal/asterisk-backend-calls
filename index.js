const server = require('./app')
const config = require('./src/config/config')

server.listen(config.server.port, () => {
    console.log(`🚀 Backend y Realtime Namespace corriendo en el puerto: ${config.server.port}`);
});