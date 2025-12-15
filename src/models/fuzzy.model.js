const db = require('../db');

/**
 * Lee acciones desde la tabla: acciones_automaticas
 */
const getAcciones = async ({ limit = 200, offset = 0 } = {}) => {
  try {
    const [rows] = await db.query(
      `SELECT id, tipo_accion, valor_accion, fecha
         FROM acciones_automaticas
        ORDER BY fecha DESC
        LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  } catch (error) {
    console.error('FuzzyModel.getAcciones error:', error);
    return [];
  }
};

/**
 * Lee una accion desde la tabla: acciones_automaticas
 */
const getAccionById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id, tipo_accion, valor_accion, fecha
         FROM acciones_automaticas
        WHERE id = ?
        LIMIT 1`,
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error('FuzzyModel.getAccionById error:', error);
    return null;
  }
};

const insertarAccion = async (_descripcion) => {
  try {
    return null; // No-OP (según tu diseño actual)
  } catch (error) {
    console.error('FuzzyModel.insertarAccion error:', error);
    return null;
  }
};

const aplicarAccionDifusa = async (_id) => {
  try {
    return true; // No-OP
  } catch (error) {
    console.error('FuzzyModel.aplicarAccionDifusa error:', error);
    return false;
  }
};

/**
 * Obtener todos los tokens de dispositivo
 */
async function getTodosLosTokens() {
  try {
    const [rows] = await db.query(`SELECT token FROM dispositivos_tokens`);
    return rows.map((r) => r.token);
  } catch (error) {
    console.error('FuzzyModel.getTodosLosTokens error:', error);
    return [];
  }
}

module.exports = {
  getAcciones,
  getAccionById,
  insertarAccion,
  aplicarAccionDifusa,
  getTodosLosTokens,
};