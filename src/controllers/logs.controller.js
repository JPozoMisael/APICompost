const LogsModel = require('../models/logs.model');

/* Helpers */
const toInt = (v, def = null) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};
const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(+d) ? null : d;
};

/**
 * GET /api/logs  (solo ADMIN)
 * Filtros (opcionales):
 *   ?accion=...&usuario_id=...&dispositivo_id=...&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Paginación (opcionales):
 *   ?limit=200&offset=0
 */
const obtenerLogs = async (req, res) => {
  try {
    const rol = String(req?.usuario?.rol || '').toUpperCase();
    if (rol !== 'ADMINISTRADOR') {
      return res.status(403).json({ mensaje: 'No autorizado para ver logs' });
    }

    const {
      accion,
      usuario_id,
      dispositivo_id,
      desde,
      hasta,
      limit,
      offset,
    } = req.query || {};

    // filtros saneados
    const filtros = {
      accion: accion ? String(accion) : null,
      usuario_id: toInt(usuario_id),
      dispositivo_id: toInt(dispositivo_id),
      desde: parseDate(desde),
      hasta: parseDate(hasta),
      // paginación con límites seguros
      limit: Math.max(0, Math.min(1000, toInt(limit, 200))),
      offset: Math.max(0, toInt(offset, 0)),
      // orden por defecto (más recientes primero); el modelo puede ignorarlo si no lo soporta
      order: [['creado_en', 'DESC']],
    };

    const logs = await LogsModel.obtenerLogs(filtros);
    return res.json(Array.isArray(logs) ? logs : []);
  } catch (error) {
    console.error('Error al obtener logs:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * POST /api/logs  (usuario autenticado)
 * Cuerpo aceptado:
 *   { accion | tipo, descripcion?, dispositivo_id? }
 * - usuario_id se toma del token (req.usuario.id)
 * - ip y user_agent se capturan del request
 */
const crearLog = async (req, res) => {
  try {
    const usuario_id = req.usuario?.id ?? null;

    // Soportamos "accion" o "tipo" como alias
    const accion = String(req.body?.accion ?? req.body?.tipo ?? '').trim();
    const descripcion = String(req.body?.descripcion ?? '').trim();
    const dispositivo_id = typeof req.body?.dispositivo_id !== 'undefined'
      ? toInt(req.body.dispositivo_id)
      : null;

    if (!accion) {
      return res.status(400).json({ mensaje: 'accion (o tipo) es obligatoria' });
    }

    const ip =
      (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) ||
      req.socket?.remoteAddress ||
      null;

    const user_agent = req.get('user-agent') || null;

    const insertId = await LogsModel.crear({
      accion,
      descripcion,       // puede ir vacío; el modelo lo maneja como string
      usuario_id,
      dispositivo_id,
      ip,
      user_agent,
    });

    return res.status(201).json({ ok: true, id: insertId ?? null });
  } catch (error) {
    console.error('Error al crear log:', error);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerLogs,
  crearLog,
};
