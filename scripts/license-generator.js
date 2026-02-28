const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getServerId } = require('../src/core/license/fingerprint');

/**
 * Script Generador de Licencias
 * Uso alternativo: node license-generator.js --company "Mi Empresa" --agents 25 --queues 5 --expires 2026-12-31 --serverid <id>
 */

const PRIVATE_KEY_PATH = path.join(__dirname, '../certs/private.pem');

// Función para obtener argumentos de línea de comandos
function getArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.split('=');
            args[key.slice(2)] = value;
        }
    });
    return args;
}

async function generateLicense() {
    const args = getArgs();

    const company = args.company || 'Empresa Pruebas';
    const agents_limit = parseInt(args.agents || '25');
    const queues_limit = parseInt(args.queues || '5');
    const expires_at = args.expires || '2026-12-31';
    let server_id = args.serverid || 'AUTO';

    if (server_id === 'AUTO') {
        server_id = getServerId();
        console.log('Using current server ID for generation:', server_id);
    }

    const payload = {
        company,
        agents_limit,
        queues_limit,
        expires_at,
        server_id,
        issued_at: new Date().toISOString().split('T')[0]
    };

    try {
        const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');

        // Firmar con RSA SHA256
        const signer = crypto.createSign('sha256');
        signer.update(JSON.stringify(payload));
        signer.end();

        const signature = signer.sign(privateKey, 'base64');

        const license = {
            ...payload,
            signature
        };

        const outputDir = path.join(__dirname, '../../');
        const outputPath = path.join(outputDir, 'license.key');

        fs.writeFileSync(outputPath, JSON.stringify(license, null, 2));

        console.log('✅ License generated successfully!');
        console.log(`📍 Path: ${outputPath}`);
        console.log('📄 Content:', JSON.stringify(license, null, 2));

    } catch (error) {
        console.error('❌ Error generating license:', error.message);
    }
}

generateLicense();
