const mysql = require("mysql2/promise");
const config = require('./config'); // Asegúrate que la ruta al archivo sea correcta

const db = mysql.createPool({
  host: config.DB.HOST,
  user: config.DB.USER,
  password: config.DB.PASSWORD,
  database: config.DB.NAME,
  port: config.DB.PORT, // Aquí ya tomará el 3319 de tu config
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;