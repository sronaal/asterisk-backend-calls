const express = require("express")
const http = require("http")
const cors = require("cors")
const config = require('./src/config/config')
const conexionMysql = require('./src/db/mysql')
const rutasCDR = require('./src/routes/routers.cdr')
const rutasRealtime = require('./src/routes/realtime.routes')
const socketService = require('./src/services/socket.service')
const amiService = require('./src/services/AMI')
const amiListener = require('./src/realtime/amiListener')
const { validateLicense } = require('./src/core/license/licenseValidator')
const licenseGuard = require('./src/core/license/licenseGuard')
const rutasLicencia = require('./src/routes/license.routes')

const app = express()

app.use(cors())
app.use(express.json())
// Rutas públicas / administrativas de licencia
app.use('/api/v1/license', rutasLicencia)

// Proteger el resto de la API con licencia
app.use(licenseGuard);

app.use('/api/v1/llamadas', rutasCDR)
app.use('/api/v1/realtime', rutasRealtime)

const server = http.createServer(app)

// Inicializar Validacion de Licencia
validateLicense();

// Inicializar Socket.io
socketService.init(server);

// Inicializar AMI de forma no bloqueante
console.log("⏳ Conectando a Asterisk AMI...");
amiService.connect()
    .then(() => {
        amiListener.init();
        console.log("✅ Listener de eventos AMI activado");
    })
    .catch(err => {
        console.error("❌ No se pudo conectar a AMI al inicio, se reintentará o revisará configuración:", err);
    });

module.exports = server

