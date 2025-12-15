const db = require('../db');

/**
 * Obtener dispositivos
 * - Admin: ve todos
 * - Usuario/Técnico: solo los suyos
 */
const getDispositivos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    let query = 'SELECT * FROM dispositivos';
    let params = [];

    if (rol !== 'ADMINISTRADOR') {
      query = 'SELECT * FROM dispositivos WHERE usuario_id = ?';
      params = [usuarioId];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en getDispositivos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Crear un nuevo dispositivo
 * - Se asocia automáticamente al usuario que lo crea
 */
const crearDispositivo = async (req, res) => {
  try {
    const { nombre, ubicacion, estado } = req.body;
    const usuarioId = req.usuario.id; // viene del token

    if (!nombre || !ubicacion) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    const nuevoDispositivo = { nombre, ubicacion, estado, usuario_id: usuarioId };

    const [result] = await db.query('INSERT INTO dispositivos SET ?', nuevoDispositivo);

    res.status(201).json({ id: result.insertId, ...nuevoDispositivo });
  } catch (error) {
    console.error('Error en crearDispositivo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  getDispositivos,
  crearDispositivo
};