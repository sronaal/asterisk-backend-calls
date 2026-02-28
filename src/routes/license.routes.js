const express = require('express');
const router = express.Router();
const { getServerId } = require('../core/license/fingerprint');
const { getLicenseStatus } = require('../core/license/licenseValidator');

/**
 * Endpoint para obtener el Server ID único de esta máquina.
 * Útil para que el cliente lo envíe al administrador y genere la licencia.
 */
router.get('/server-id', (req, res) => {
    try {
        const serverId = getServerId();
        res.json({ server_id: serverId });
    } catch (error) {
        res.status(500).json({ error: 'Error generating server id' });
    }
});

/**
 * Obtiene el estado actual de la licencia
 */
router.get('/status', (req, res) => {
    res.json(getLicenseStatus());
});

module.exports = router;
