const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 🔐 Generador de Llaves RSA para CallMetrics v5
 * Ejecuta este script una sola vez en tu equipo de administración.
 */

// Configuración de la generación
const options = {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
};

try {
    console.log('⏳ Generando par de llaves RSA (2048 bits)...');

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', options);

    const certDir = path.join(__dirname, '../backend/certs');

    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }

    // Guardar archivos
    fs.writeFileSync(path.join(certDir, 'private.pem'), privateKey);
    fs.writeFileSync(path.join(certDir, 'public.pem'), publicKey);

    console.log('✅ EXITO: Llaves generadas correctamente.');
    console.log('📍 Ubicación:', certDir);
    console.log('---');
    console.log('⚠️ IMPORTANTE:');
    console.log('1. Guarda "private.pem" en un lugar seguro. Se usa para GENERAR licencias.');
    console.log('2. Copia "public.pem" al servidor del cliente. Se usa para VALIDAR licencias.');
    console.log('3. ¡NUNCA entregues la llave privada al cliente!');

} catch (error) {
    console.error('❌ Error generando llaves:', error.message);
}
