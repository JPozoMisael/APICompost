// models/logs.model.js
const db = require('../db');

/**
 * Obtener logs con filtros opcionales.
 * Filtros soportados: accion, usuario_id, dispositivo_id, desde, hasta
 */
const obtenerLogs = async ({ accion, usuario_id, dispositivo_id, desde, hasta }) => {
  const where = [];
  const params = [];

  if (accion)        { where.push('accion = ?');        params.push(accion); }
  if (usuario_id)    { where.push('usuario_id = ?');    params.push(usuario_id); }
  if (dispositivo_id){ where.push('dispositivo_id = ?');params.push(dispositivo_id); }
  if (desde)         { where.push('creado_en >= ?');    params.push(desde); }
  if (hasta)         { where.push('creado_en <= ?');    params.push(hasta); }

  const sql = `
    SELECT id, dispositivo_id, usuario_id, accion, descripcion, ip, user_agent, creado_en
    FROM logs
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY creado_en DESC
    LIMIT 1000
  `;
  const [rows] = await db.query(sql, params);
  return rows;
};

/**
 * Crear log.
 * - usuario_id puede ser null si quieres permitir eventos del sistema
 */
const crear = async ({ accion, descripcion, usuario_id = null, dispositivo_id = null, ip = null, user_agent = null }) => {
  const sql = `
    INSERT INTO logs (accion, descripcion, usuario_id, dispositivo_id, ip, user_agent, creado_en)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  const [result] = await db.query(sql, [accion, descripcion, usuario_id, dispositivo_id, ip, user_agent]);
  return result.insertId;
};

module.exports = { obtenerLogs, crear };
