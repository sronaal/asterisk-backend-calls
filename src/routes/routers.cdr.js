const router = require("express").Router()
const controllerCDR = require('../controllers/cdr.controller')

router.get('/', controllerCDR.obtenerLlamadasNormalizadas)
router.get('/agentes', controllerCDR.obtenerEstadisticasAgentes)
router.get('/queues', controllerCDR.obtenerLlamadasPorColas)
router.get('/queues/estadisticas', controllerCDR.obtenerEstadisticasPorColas)
router.get('/total', controllerCDR.obtenerTotalLlamadasHoy)
module.exports = router