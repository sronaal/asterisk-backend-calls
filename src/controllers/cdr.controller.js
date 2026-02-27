const express = require("express")
const daoCDR = require('../dao/cdr')


const obtenerLlamadasNormalizadas = async  (req = express.request, res = express.response ) => {

    try {
        const llamadas = await daoCDR.obtenerLlamadasNormalizadas()
        
        res.status(200).json(llamadas)
    } catch (error) {
        console.log(error)
        return res.send(500).json({
            msg: "Error al obtener llamadas normalizadas",
            error
        })
    }    
    
}

const obtenerEstadisticasAgentes = async (req = express.request, res = express.response) => {

    try {
        const llamadasPorAgente = await daoCDR.obtenerEstadisticasAgentes()
        return res.status(200).json(llamadasPorAgente)
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            msg: "Error al obtener estadisticas de agentes",
            error
        })
    }
}

const obtenerLlamadasPorColas = async (req = express.request, res = express.response) => {

    try {
        const llamadasPorColas = await daoCDR.obtenerLlamadasPorColas()
        return res.status(200).json(llamadasPorColas)
    } catch (error) {
        return res.status(500).json({
            msg: "Error al obtener llamadas por colas",
            error
        })
    }
}

const obtenerEstadisticasPorColas = async (req = express.request, res = express.response) => {

    try {
        const llamadasPorColas = await daoCDR.obtenerEstadisticasPorColas()
        return res.status(200).json(llamadasPorColas)
    } catch (error) {
        return res.status(500).json({
            msg: "Error al obtener estadisticas por colas",
            error
        })
    }
} 

module.exports = {
    obtenerLlamadasNormalizadas,
    obtenerEstadisticasAgentes,
    obtenerLlamadasPorColas,
    obtenerEstadisticasPorColas
}