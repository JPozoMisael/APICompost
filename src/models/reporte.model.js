// models/reporte.model.js
const db = require('../db');

const getReportes = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM reportes ORDER BY fecha DESC');
    return rows;
  } catch (error) {
    console.error('Error en reporte.model.getReportes:', error);
    throw error;
  }
};

const getReporteById = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM reportes WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error en reporte.model.getReporteById:', error);
    throw error;
  }
};

const crearReporte = async ({ sensor_id, descripcion, nivel_alerta, fecha }) => {
  try {
    const [result] = await db.query(
      'INSERT INTO reportes (sensor_id, descripcion, nivel_alerta, fecha) VALUES (?, ?, ?, ?)',
      [sensor_id, descripcion, nivel_alerta, fecha]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error en reporte.model.crearReporte:', error);
    throw error;
  }
};

const eliminarReporte = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM reportes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error en reporte.model.eliminarReporte:', error);
    throw error;
  }
};

module.exports = {
  getReportes,
  getReporteById,
  crearReporte,
  eliminarReporte
};