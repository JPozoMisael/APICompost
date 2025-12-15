const pool = require('../db'); 

const AlertasModel = {
  /**
   * Lista alertas (opcionalmente solo no leídas)
   */
  async listar({ soloNoLeidas = false } = {}) {
    let sql = `
      SELECT 
        id,
        dispositivo_id,
        tipo,
        mensaje,
        nivel,
        fecha,
        leida,
        usuario_id,
        lectura_id
      FROM alertas
    `;
    const params = [];

    if (soloNoLeidas) {
      sql += ' WHERE leida = 0';
    }

    sql += ' ORDER BY fecha DESC LIMIT 200';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Crea una nueva alerta
   */
  async crear({
    dispositivo_id = null,
    tipo = 'warning',
    mensaje = '',
    nivel = 'info',
    fecha = null,
    leida = 0,
    usuario_id = null,
    lectura_id = null,
  }) {
    const sql = `
      INSERT INTO alertas
      (dispositivo_id, tipo, mensaje, nivel, fecha, leida, usuario_id, lectura_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const data = [
      dispositivo_id,
      tipo,
      mensaje,
      nivel,
      fecha || new Date(), // MySQL lo acepta como Date y lo guarda como DATETIME
      leida ? 1 : 0,
      usuario_id,
      lectura_id,
    ];

    const [result] = await pool.query(sql, data);

    return {
      id: result.insertId,
      dispositivo_id,
      tipo,
      mensaje,
      nivel,
      fecha,
      leida: !!leida,
      usuario_id,
      lectura_id,
    };
  },

  /**
   * Marca una alerta como leída
   */
  async marcarComoLeida(id) {
    const sql = `UPDATE alertas SET leida = 1 WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  },

  /**
   * Obtener tokens de dispositivo de un usuario
   */
  async getTokensDispositivo(usuario_id) {
    const sql = `
      SELECT token
      FROM dispositivos_tokens
      WHERE usuario_id = ?
    `;
    const [rows] = await pool.query(sql, [usuario_id]);
    return rows.map(row => row.token);
  },

  /**
   * Guarda el token de dispositivo de un usuario
   */
  async guardarTokenDispositivo(usuario_id, token) {
    const sql = `
      INSERT INTO dispositivos_tokens (usuario_id, token)
      VALUES (?, ?)
    `;
    const data = [usuario_id, token];
    const [result] = await pool.query(sql, data);
    return result.insertId;
  },
};

module.exports = AlertasModel;