// models/accion.model.js
const db = require('../db');

/**
 * Obtener todas las acciones
 */
const obtenerTodas = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM acciones ORDER BY fecha DESC');
    return rows;
  } catch (error) {
    console.error('Error en accion.model.obtenerTodas:', error);
    throw error;
  }
};

/**
 * Obtener acción por ID
 */
const obtenerPorId = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM acciones WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error en accion.model.obtenerPorId:', error);
    throw error;
  }
};

/**
 * Crear nueva acción
 */
const crear = async ({ descripcion }) => {
  try {
    const [result] = await db.query(
      'INSERT INTO acciones (descripcion, aplicada, fecha) VALUES (?, 0, NOW())',
      [descripcion]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error en accion.model.crear:', error);
    throw error;
  }
};

/**
 * Marcar acción como aplicada
 */
const aplicar = async (id) => {
  try {
    const [result] = await db.query(
      'UPDATE acciones SET aplicada = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error en accion.model.aplicar:', error);
    throw error;
  }
};

/**
 * Eliminar acción
 */
const eliminar = async (id) => {
  try {
    const [result] = await db.query('DELETE FROM acciones WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error en accion.model.eliminar:', error);
    throw error;
  }
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  crear,
  aplicar,
  eliminar
};