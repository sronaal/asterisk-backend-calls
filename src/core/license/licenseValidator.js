const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getServerId } = require('./fingerprint');

const LICENSE_PATH = path.join(__dirname, '../../../../license.key');
const PUBLIC_KEY_PATH = path.join(__dirname, '../../../../backend/certs/public.pem');

let currentStatus = {
    valid: false,
    expired: false,
    agents_limit: 10, // Default demo
    queues_limit: 3,  // Default demo
    days_remaining: 0,
    server_id_mismatch: false,
    company: 'Demo Mode',
    isDemo: true
};

/**
 * Validador de licencia
 */
function validateLicense() {
    try {
        if (!fs.existsSync(LICENSE_PATH)) {
            console.log('⚠ No license.key found. Activating DEMO mode.');
            activateDemo();
            return currentStatus;
        }

        const licenseDataRaw = fs.readFileSync(LICENSE_PATH, 'utf-8');
        const license = JSON.parse(licenseDataRaw);
        const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8');

        // Extraer firma y el payload (sin firma)
        const { signature, ...payload } = license;
        const payloadBuffer = Buffer.from(JSON.stringify(payload));

        // Verificar firma RSA SHA256
        const verifier = crypto.createVerify('sha256');
        verifier.update(payloadBuffer);
        verifier.end();

        const isValidSignature = verifier.verify(publicKey, signature, 'base64');

        if (!isValidSignature) {
            console.error('❌ CRITICAL: Invalid License Signature!');
            markInvalid();
            return currentStatus;
        }

        // Verificar Server ID
        const currentServerId = getServerId();
        if (license.server_id !== currentServerId) {
            console.error('❌ CRITICAL: Server ID Mismatch! License not valid for this machine.');
            markInvalid(true);
            return currentStatus;
        }

        // Verificar Fecha de Expiración
        const now = new Date();
        const expiresAt = new Date(license.expires_at);
        const diffTime = expiresAt - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            currentStatus = {
                valid: false,
                expired: true,
                agents_limit: 0,
                queues_limit: 0,
                days_remaining: diffDays,
                company: license.company,
                isDemo: false
            };
            console.warn('🔴 License EXPIRED!');
        } else {
            currentStatus = {
                valid: true,
                expired: false,
                agents_limit: license.agents_limit,
                queues_limit: license.queues_limit,
                days_remaining: diffDays,
                company: license.company,
                isDemo: false
            };
            console.log(`🟢 License VALID: ${license.company} (${diffDays} days remaining)`);
        }

    } catch (error) {
        console.error('❌ Error validating license:', error.message);
        markInvalid();
    }
    return currentStatus;
}

function activateDemo() {
    currentStatus = {
        valid: true,
        expired: false,
        agents_limit: 10,
        queues_limit: 3,
        days_remaining: 15,
        company: 'MODO DEMO',
        isDemo: true
    };
}

function markInvalid(serverMismatch = false) {
    currentStatus = {
        valid: false,
        expired: false,
        agents_limit: 0,
        queues_limit: 0,
        days_remaining: 0,
        server_id_mismatch: serverMismatch,
        company: 'INVALID',
        isDemo: false
    };
}

function getLicenseStatus() {
    return currentStatus;
}

// Watcher para recargar licencia dinámicamente
fs.watch(path.dirname(LICENSE_PATH), (eventType, filename) => {
    if (filename === 'license.key') {
        console.log('🔄 license.key changed, reloading validation...');
        validateLicense();
    }
});

module.exports = { validateLicense, getLicenseStatus };
