const {Server} = require("socket.io")
class SocketService{

    constructor(){
        this.io = null
    }


    init(server){

        this.io = new Server(server, {
            cors:{
                origin: '*',
                methods: ['GET', 'POST']
            }
        });
    
        this.io.on('connection', (socket) => {

            const estadoInicial = {
                llamadasActivas: 0,
                colasActivas: 0
            }

            socket.emit('state.initial', estadoInicial)
        })

        


    }

    
}