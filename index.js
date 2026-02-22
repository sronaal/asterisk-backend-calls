const server = require('./app')
const config = require('./src/config/config')


server.listen(config.server.port, () => {
    console.log(`Server HTTP On ${config.server.port}`)
})