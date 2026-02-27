const router = require("express").Router();
const controller = require('../controllers/realtime.controller');

router.get('/calls', controller.getCallsSnapshot);
router.get('/agents', controller.getAgentsSnapshot);
router.get('/queues', controller.getQueuesSnapshot);

module.exports = router;
