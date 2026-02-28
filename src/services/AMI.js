const asteriskManager = require("asterisk-manager")
const config = require("../config/config")

class AMI {



    constructor() {

        this.ami = null
        this.connected = false
    }


    connect() {
        return new Promise((resolve, reject) => {
            try {
                const { host, pass, port, user } = config.ami_config;


                this.ami = new asteriskManager(port, host, user, pass, true);

                this.ami.on('connect', () => {
                    this.connected = true;

                    resolve(this.ami);
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
                    const eventName = (evt.event || '').toLowerCase();
                    const relevantEvents = ['newchannel', 'queuecallerjoin', 'agentconnect', 'hangup', 'dialbegin', 'dial', 'bridgeenter', 'bridge'];
                    if (relevantEvents.includes(eventName)) {

                    }
                });

            } catch (error) {
                console.error("Error fatal al iniciar AMI Manager:", error);
                reject(error);
            }
        });
    }
}

const amiService = new AMI();
module.exports = amiService;