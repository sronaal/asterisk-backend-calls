const asteriskManager = require("asterisk-manager")
const config = require("../config/config")

class AMI{



    constructor(){

        this.ami = null
        this.connected = false
    }


    connect(){

        const { host,pass,port,user } = config.ami_config

        this.ami = new asteriskManager(port,host,user,pass, true)

        this.ami.on('connect', () => {
            this.connect = true
            console.log("Connect to AMI")

        })

        this.ami.on('disconnect', () => {
            this.connect = false
            console.error("Disconnect from AMI")
        })
    }
}



const amiService = new AMI()