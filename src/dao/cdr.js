const { conexionAsteriskCDR } = require("../db/mysql")

class DaoCDR{


    async obtenerLlamadasNormalizadas(){
        const [rows] = await conexionAsteriskCDR.query('SELECT * FROM asteriskcdrdb.vw_llamadas_normalizadas;')
        
        return rows
    }

    async obtenerEstadisticasAgentes(){
        const [rows] = await conexionAsteriskCDR.query('SELECT * FROM asteriskcdrdb.vw_estadisticas_agentes_general;')

        return rows
    }
}


const daoCDR = new DaoCDR()
module.exports = daoCDR