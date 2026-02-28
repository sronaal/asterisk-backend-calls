const dotenv = require("dotenv")
dotenv.config({})
const config = {

    "server": {
        "port": process.env.PORT || 3100
    },
    "ami_config": {
        "user": process.env.AMI_USER,
        "pass": process.env.AMI_PASS,
        "host": process.env.AMI_HOST,
        "port": process.env.AMI_PORT
    },
    "db_asterisk": {
        "user": process.env.DB_USER_Asterisk,
        "pass": process.env.DB_PASSWORD_Asterisk,
        "host": process.env.DB_HOST_Asterisk,
        "db_name": process.env.DB_NAME_Asterisk,
        "port": process.env.DB_PORT_Asterisk
    },
    "db_asteriskcdr": {
        "user": process.env.DB_USER_AsteriskCDR,
        "pass": process.env.DB_PASSWORD_AsteriskCDR,
        "db_name": process.env.DB_NAME_AsteriskCDR,
        "port": process.env.DB_PORT_AsteriskCDR,
        "host": process.env.DB_HOST_AsteriskCDR
    }
}

module.exports = config