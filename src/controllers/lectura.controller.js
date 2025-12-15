const db = require('../db');

/**
 * Registrar nueva lectura desde el IoT
 * - Se asocia automáticamente al dispositivo y al usuario dueño del dispositivo
 */
const crearLectura = async (req, res) => {
  try {
    const { dispositivo_id, humedad, temperatura, nh3, ch4 } = req.body;

    if (!dispositivo_id || !humedad || !temperatura) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    // Validar que el dispositivo exista y pertenezca al usuario (si no es admin)
    const [rows] = await db.query('SELECT * FROM dispositivos WHERE id = ?', [dispositivo_id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Dispositivo no encontrado' });
    }

    const dispositivo = rows[0];
    if (req.usuario.rol !== 'ADMINISTRADOR' && dispositivo.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No tienes acceso a este dispositivo' });
    }

    // Insertar lectura
    const [result] = await db.query(
      'INSERT INTO lecturas (dispositivo_id, usuario_id, humedad, temperatura, nh3, ch4) VALUES (?,?,?,?,?,?)',
      [dispositivo_id, req.usuario.id, humedad, temperatura, nh3 || 0, ch4 || 0]
    );

    res.status(201).json({
      id: result.insertId,
      dispositivo_id,
      usuario_id: req.usuario.id,
      humedad,
      temperatura,
      nh3,
      ch4
    });
  } catch (error) {
    console.error('Error en crearLectura:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Obtener lecturas
 * - Admin: ve todas
 * - Usuario/Técnico: solo las de sus dispositivos
 */
const getLecturas = async (req, res) => {
  try {
    const rol = req.usuario.rol;
    const usuarioId = req.usuario.id;

    let query = 'SELECT * FROM lecturas';
    let params = [];

    if (rol !== 'ADMINISTRADOR') {
      query = 'SELECT * FROM lecturas WHERE usuario_id = ?';
      params = [usuarioId];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en getLecturas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  crearLectura,
  getLecturas
};