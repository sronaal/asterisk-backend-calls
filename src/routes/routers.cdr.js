const router = require("express").Router()
const controllerCDR = require('../controllers/cdr.controller')

router.get('/', controllerCDR.obtenerLlamadasNormalizadas)
router.get('/agentes', controllerCDR.obtenerEstadisticasAgentes)


module.exports = router