const express = require("express")
const http = require("http")
const cors = require("cors")
const conexionMysql = require('./src/db/mysql')
const rutasCDR = require('./src/routes/routers.cdr')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/v1/llamadas', rutasCDR)

const server = http.createServer(app)


module.exports = server
