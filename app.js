const express = require("express")
const http = require("http")
const cors = require("cors")
const conexionMysql = require('./src/db/mysql')
const rutasCDR = require('./src/routes/routers.cdr')
const rutasRealtime = require('./src/routes/realtime.routes')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/v1/llamadas', rutasCDR)
app.use('/api/v1/realtime', rutasRealtime)

const server = http.createServer(app)


module.exports = server
