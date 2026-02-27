const { conexionAsterisk } = require("../db/mysql")

class DaoAsterisk{


    async obtenerExtensiones(){
        try {
            const [rows] = await conexionAsterisk.query('SELECT * FROM asterisk.obtenerExtensiones')
            return rows
        } catch (error) {
            throw error
        }
    }

    async obtenerColas(){

        try {
            const [rows] = await conexionAsterisk.query('SELECT * FROM asterisk.obtenerColas;')
            return rows
        } catch (error) {
            throw error
        }
    }
}

const daoAsterisk = new DaoAsterisk()
module.exports = daoAsterisk