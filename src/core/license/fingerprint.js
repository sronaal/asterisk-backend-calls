const os = require('os');
const crypto = require('crypto');

/**
 * Genera un fingerprint único del servidor combinando MAC, hostname y modelo de CPU.
 * @returns {string} SHA256 Hash del fingerprint.
 */
function getServerId() {
    const interfaces = os.networkInterfaces();
    let mac = '';

    // Buscar la primera MAC address válida (no interna)
    for (const name in interfaces) {
        const iface = interfaces[name];
        for (const info of iface) {
            if (!info.internal && info.mac !== '00:00:00:00:00:00') {
                mac = info.mac;
                break;
            }
        }
        if (mac) break;
    }

    const hostname = os.hostname();
    const cpuModel = os.cpus()[0]?.model || 'unknown-cpu';

    const rawData = `${mac}-${hostname}-${cpuModel}`;
    return crypto.createHash('sha256').update(rawData).digest('hex');
}

module.exports = { getServerId };
