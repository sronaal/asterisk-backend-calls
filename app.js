const express = require("express")
const http = require("http")
const conexionMysql = require('./src/db/mysql')


const app = express()
const server = http.createServer(app)


module.exports = server
