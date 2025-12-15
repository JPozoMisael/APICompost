// models/dispositivo.model.js
const db = require('../db');

const getDispositivos = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM dispositivos');
    return rows;
  } catch (error) {
    console.error('Error en dispositivo.model.getDispositivos:', error);
    throw error;
  }
};

const getDispositivoById = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM dispositivos WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error en dispositivo.model.getDispositivoById:', error);
    throw error;
  }
};

const crearDispositivo = async ({ nombre, ubicacion, estado }) => {
  try {
    const [result] = await db.query(
      'INSERT INTO dispositivos (nombre, ubicacion, estado) VALUES (?, ?, ?)',
      [nombre, ubicacion, estado]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error en dispositivo.model.crearDispositivo:', error);
    throw error;
  }
};

const actualizarDispositivo = async (id, { nombre, ubicacion, estado }) => {
  try {
    const [result] = await db.query(
      'UPDATE dispositivos SET nombre = ?, ubicacion = ?, estado = ? WHERE id = ?',
      [nombre, ubicacion, estado, id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error en dispositivo.model.actualizarDispositivo:', error);
    throw error;
  }
};

const eliminarDispositivo = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM dispositivos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error en dispositivo.model.eliminarDispositivo:', error);
    throw error;
  }
};

module.exports = {
  getDispositivos,
  getDispositivoById,
  crearDispositivo,
  actualizarDispositivo,
  eliminarDispositivo
};