const db = require('../db');

/**
 * Obtener todos los reportes
 * - Admin ve todos
 * - Usuarios solo los de sus dispositivos
 */
const getReportes = async (req, res) => {
  try {
    let query = 'SELECT * FROM reportes';
    let params = [];

    if (req.usuario.rol !== 'ADMINISTRADOR') {
      query = 'SELECT * FROM reportes WHERE usuario_id = ?';
      params = [req.usuario.id];
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en getReportes:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Obtener un reporte específico
 */
const getReporteById = async (req, res) => {
  const { id } = req.params;
  try {
    let query = 'SELECT * FROM reportes WHERE id = ?';
    let params = [id];

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    // Validar acceso
    if (req.usuario.rol !== 'ADMINISTRADOR' && rows[0].usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No autorizado para ver este reporte' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error en getReporteById:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Crear un reporte
 */
const crearReporte = async (req, res) => {
  const { dispositivo_id, descripcion, nivel_alerta } = req.body;

  if (!dispositivo_id || !descripcion) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO reportes (dispositivo_id, usuario_id, descripcion, nivel_alerta, fecha)
       VALUES (?,?,?,?,NOW())`,
      [dispositivo_id, req.usuario.id, descripcion, nivel_alerta || 'normal']
    );

    res.status(201).json({
      id: result.insertId,
      dispositivo_id,
      usuario_id: req.usuario.id,
      descripcion,
      nivel_alerta: nivel_alerta || 'normal'
    });
  } catch (error) {
    console.error('Error en crearReporte:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Eliminar un reporte
 * - Admin puede eliminar cualquiera
 * - Usuario solo los suyos
 */
const eliminarReporte = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM reportes WHERE id=?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Reporte no encontrado' });
    }

    const reporte = rows[0];

    if (req.usuario.rol !== 'ADMINISTRADOR' && reporte.usuario_id !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No autorizado para eliminar este reporte' });
    }

    await db.query('DELETE FROM reportes WHERE id=?', [id]);

    res.json({ mensaje: 'Reporte eliminado correctamente' });
  } catch (error) {
    console.error('Error en eliminarReporte:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  getReportes,
  getReporteById,
  crearReporte,
  eliminarReporte
};