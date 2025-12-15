const db = require('../db');

/**
 * Registrar nueva acción (estado de actuadores en una lectura)
 */
const crearAccion = async (req, res) => {
  try {
    const {
      dispositivo_id,
      id_lectura,
      motor,
      servo1,
      servo2,
      ventilador1,
      ventilador2,
      electroval,
      recomendacion
    } = req.body;

    if (!dispositivo_id) {
      return res.status(400).json({ mensaje: 'Falta el dispositivo_id' });
    }

    // Insertar acción ligada al usuario del token
    const [result] = await db.query(
      `INSERT INTO acciones 
      (dispositivo_id, usuario_id, id_lectura, motor, servo1, servo2, ventilador1, ventilador2, electroval, recomendacion)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        dispositivo_id,
        req.usuario.id,
        id_lectura || null,
        motor || null,
        servo1 || null,
        servo2 || null,
        ventilador1 || null,
        ventilador2 || null,
        electroval || null,
        recomendacion || null
      ]
    );

    res.status(201).json({
      id: result.insertId,
      dispositivo_id,
      usuario_id: req.usuario.id,
      id_lectura,
      motor,
      servo1,
      servo2,
      ventilador1,
      ventilador2,
      electroval,
      recomendacion
    });
  } catch (error) {
    console.error('Error en crearAccion:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Obtener historial de acciones
 * - Admin ve todas
 * - Usuario/Investigador solo las suyas
 */
const getAcciones = async (req, res) => {
  try {
    let query = 'SELECT * FROM acciones';
    let params = [];

    if (req.usuario.rol !== 'ADMINISTRADOR') {
      query = 'SELECT * FROM acciones WHERE usuario_id = ?';
      params = [req.usuario.id];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en getAcciones:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  crearAccion,
  getAcciones
};