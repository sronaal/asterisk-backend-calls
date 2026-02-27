const { conexionAsteriskCDR } = require("../db/mysql")

class DaoCDR {


    async obtenerLlamadasNormalizadas() {
        const [rows] = await conexionAsteriskCDR.query('SELECT * FROM asteriskcdrdb.vw_llamadas_normalizadas;')

        return rows
    }

    async obtenerEstadisticasAgentes() {
        const [rows] = await conexionAsteriskCDR.query('SELECT * FROM asteriskcdrdb.vw_estadisticas_agentes_general;')

        return rows
    }

    async obtenerLlamadasPorColas() {
        const [rows] = await conexionAsteriskCDR.query('SELECT * FROM asteriskcdrdb.vw_estadisticas_colas;')
        return rows
    }

    async obtenerEstadisticasPorColas() {
        const [rows] = await conexionAsteriskCDR.query('SELECT * FROM asteriskcdrdb.vw_colas_estadisticas;')
        return rows
    }

    async obtenerTotalLlamadasHoy() {
        const [rows] = await conexionAsteriskCDR.query(`
            SELECT COUNT(*) as total 
            FROM asteriskcdrdb.cdr 
            WHERE DATE(calldate) = CURDATE();
        `)
        return rows[0]?.total || 0;
    }
}


const daoCDR = new DaoCDR()
module.exports = daoCDR