const db = require('../db');

/**
 * Inserta en la tabla `lecturas` con columnas:
 * id, dispositivo_id, usuario_id, temperatura,
 * humedad1..4, humedadPromedio, CH4, NH3,
 * servo1, servo2, ventilador1, ventilador2, electroval, motor, fecha
 */
const guardarLectura = async (lectura) => {
  try {
    let {
      dispositivo_id,
      usuario_id,
      h1, h2, h3, h4,
      humedadPromedio,
      CH4, NH3,
      temperatura,
      motor,
      servo,      // se mapea a servo1
      valvula,    // se mapea a electroval
      ventilador, // se mapea a ventilador1
      fecha
    } = lectura;

    // Último resguardo: resolver usuario_id si aún es null
    if (usuario_id == null && dispositivo_id != null) {
      const [r] = await db.query(
        'SELECT usuario_id FROM dispositivos WHERE id = ? LIMIT 1',
        [dispositivo_id]
      );
      if (r?.[0]?.usuario_id != null) usuario_id = r[0].usuario_id;
    }
    if (usuario_id == null && process.env.DEFAULT_USUARIO_ID) {
      usuario_id = Number(process.env.DEFAULT_USUARIO_ID);
    }
    if (usuario_id == null) {
      const e = new Error('usuario_id es requerido y no pudo resolverse');
      e.code = 'USR_ID_NULL';
      throw e;
    }

    const [result] = await db.query(
      `INSERT INTO lecturas
        (dispositivo_id, usuario_id, temperatura,
         humedad1, humedad2, humedad3, humedad4, humedadPromedio,
         CH4, NH3, servo1, servo2, ventilador1, ventilador2, electroval, motor, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dispositivo_id, usuario_id, temperatura ?? null,
        h1 ?? null, h2 ?? null, h3 ?? null, h4 ?? null, humedadPromedio ?? null,
        CH4 ?? null, NH3 ?? null,
        servo ?? null, null,                  // servo1 = servo normalizado
        ventilador ?? null, null,            // ventilador1 = ventilador normalizado
        valvula ?? null,                     // electroval
        motor ?? null,
        fecha ? new Date(fecha) : new Date()
      ]
    );

    return result.insertId;
  } catch (err) {
    console.error('Error en sensor.model.guardarLectura:', err.code, err.sqlMessage || err.message);
    throw err;
  }
};

const obtenerLecturas = async ({ dispositivo_id, limit } = {}) => {
  try {
    const lim = Math.max(1, Math.min(Number(limit) || 200, 2000));
    let sql = `SELECT *
                 FROM lecturas
                WHERE 1=1`;
    const params = [];
    if (dispositivo_id) {
      sql += ` AND dispositivo_id = ?`;
      params.push(dispositivo_id);
    }
    sql += ` ORDER BY fecha DESC LIMIT ?`;
    params.push(lim);

    const [rows] = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error('Error en sensor.model.obtenerLecturas:', err.code, err.sqlMessage || err.message);
    throw err;
  }
};

module.exports = { guardarLectura, obtenerLecturas };
