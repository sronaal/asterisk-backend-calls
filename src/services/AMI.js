const asteriskManager = require("asterisk-manager")
const config = require("../config/config")

class AMI {



    constructor() {

        this.ami = null
        this.connected = false
    }


    connect() {
        const { host, pass, port, user } = config.ami_config;

        this.ami = new asteriskManager(port, host, user, pass, true);

        this.ami.on('connect', () => {
            this.connected = true;
            console.log("Conectado exitosamente a AMI");
        });

        this.ami.on('disconnect', () => {
            this.connected = false;
            console.error("Desconectado de AMI");
        });

        this.ami.on('error', (err) => {
            console.error("Error en conexión AMI:", err);
        });

        // Permitir que otros módulos escuchen todos los eventos
        this.ami.on('managerevent', (evt) => {
            // Log opcional para depuración
            // console.log("Evento AMI:", evt.event);
        });
    }
}

const amiService = new AMI();
module.exports = amiService;