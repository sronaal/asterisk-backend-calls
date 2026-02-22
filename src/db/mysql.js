const mysql = require('mysql2/promise');
const config = require('../config/config');
require('dotenv').config();

const conexionAsterisk = mysql.createPool({
  host: config.db_asterisk.host,
  user: config.db_asterisk.user,
  password: config.db_asterisk.pass,
  database: config.db_asterisk.db_name,
  port: config.db_asterisk.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const conexionAsteriskCDR = mysql.createPool({
  host: config.db_asteriskcdr.host,
  user: config.db_asteriskcdr.user,
  password: config.db_asteriskcdr.pass,
  database: config.db_asteriskcdr.db_name,
  port: config.db_asteriskcdr.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 🔥 Función de inicialización
async function initDatabase() {
  try {
    const conn1 = await conexionAsterisk.getConnection();
    console.log('MySQL Asterisk Conectado');
    conn1.release();

    const conn2 = await conexionAsteriskCDR.getConnection();
    console.log('MySQL Asterisk CDR Conectado');
    conn2.release();
  } catch (error) {
    console.error('Error conexión MySQL:', error);
  }
}

// Ejecutar sin top-level await
initDatabase();

module.exports = {
  conexionAsterisk,
  conexionAsteriskCDR
};