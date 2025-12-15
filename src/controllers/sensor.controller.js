const db = require('../db');
const SensorModel = require('../models/sensor.model');

/* ============================================
 * CRUD del catálogo de SENSORES
 * ============================================ */

const crearSensor = async (req, res) => {
  try {
    console.log('[CREAR SENSOR] body =', req.body);
    const { dispositivo_id, nombre, tipo, ubicacion, topic_publica, topic_suscribe } = req.body;

    if (!dispositivo_id || !nombre || !tipo) {
      return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
    }

    const [result] = await db.query(
      `INSERT INTO sensores (dispositivo_id, nombre, tipo, ubicacion, topic_publica, topic_suscribe)
       VALUES (?,?,?,?,?,?)`,
      [dispositivo_id, nombre, tipo, ubicacion || null, topic_publica || null, topic_suscribe || null]
    );

    return res.status(201).json({
      id: result.insertId,
      dispositivo_id,
      nombre,
      tipo,
      ubicacion: ubicacion || null,
      topic_publica: topic_publica || null,
      topic_suscribe: topic_suscribe || null
    });
  } catch (err) {
    console.error('[CREAR SENSOR][ERROR]', err);
    return res.status(500).json({ mensaje: 'Error al crear sensor' });
  }
};

const listarSensores = async (req, res) => {
  try {
    let sql = `
      SELECT s.*
      FROM sensores s
      JOIN dispositivos d ON d.id = s.dispositivo_id
    `;
    const params = [];
    if (req.usuario?.rol !== 'ADMINISTRADOR') {
      sql += ' WHERE d.usuario_id = ?';
      params.push(req.usuario?.id);
    }
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('[LISTAR SENSORES][ERROR]', err);
    return res.status(500).json({ mensaje: 'Error al listar sensores' });
  }
};

const actualizarSensor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, ubicacion, topic_publica, topic_suscribe } = req.body;
    const [r] = await db.query(
      `UPDATE sensores
         SET nombre=?, tipo=?, ubicacion=?, topic_publica=?, topic_suscribe=?
       WHERE id=?`,
      [nombre, tipo, ubicacion || null, topic_publica || null, topic_suscribe || null, id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ mensaje: 'Sensor no encontrado' });
    return res.json({ mensaje: 'Sensor actualizado' });
  } catch (err) {
    console.error('[ACTUALIZAR SENSOR][ERROR]', err);
    return res.status(500).json({ mensaje: 'Error al actualizar sensor' });
  }
};

const eliminarSensor = async (req, res) => {
  try {
    const { id } = req.params;
    const [r] = await db.query('DELETE FROM sensores WHERE id=?', [id]);
    if (r.affectedRows === 0) return res.status(404).json({ mensaje: 'Sensor no encontrado' });
    return res.json({ mensaje: 'Sensor eliminado' });
  } catch (err) {
    console.error('[ELIMINAR SENSOR][ERROR]', err);
    return res.status(500).json({ mensaje: 'Error al eliminar sensor' });
  }
};

/* ============================================
 * Helpers
 * ============================================ */

function normalizeOnOff(v) {
  if (typeof v === 'boolean') return v ? 'ON' : 'OFF';
  const s = String(v ?? '').trim().toLowerCase();
  if (['1', 'on', 'encendido', 'abierto', 'true', 'si', 'sí'].includes(s)) return 'ON';
  if (['0', 'off', 'apagado', 'cerrado', 'false', 'no'].includes(s)) return 'OFF';
  return v == null ? null : String(v).toUpperCase();
}

function pickNum(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined || v === '') continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
function pickOnOff(...vals) {
  for (const v of vals) {
    const n = normalizeOnOff(v);
    if (n) return n;
  }
  return null;
}

async function resolverIdsPorSensorId(sensorId) {
  const sid = (sensorId || '').trim();
  console.log('[RESOLVER IDS] sensorId =', sid);
  const [rows] = await db.query(
    `SELECT d.id AS dispositivo_id, d.usuario_id
       FROM sensores s
       JOIN dispositivos d ON d.id = s.dispositivo_id
      WHERE s.topic_publica = ? OR s.topic_suscribe = ? OR s.nombre = ?
      LIMIT 1`,
    [sid, sid, sid]
  );
  console.log('[RESOLVER IDS] resultado =', rows);
  return rows?.[0] || null;
}

async function resolverUsuarioPorDispositivo(dispositivo_id) {
  console.log('[RESOLVER USUARIO] dispositivo_id =', dispositivo_id);
  const [rows] = await db.query(
    `SELECT usuario_id FROM dispositivos WHERE id = ? LIMIT 1`,
    [dispositivo_id]
  );
  console.log('[RESOLVER USUARIO] resultado =', rows);
  return rows?.[0]?.usuario_id ?? null;
}

/* ============================================
 * Ingesta de lecturas (API KEY)
 * ============================================ */

const ingestarLectura = async (req, res) => {
  try {
    console.log('[INGESTA] body =', JSON.stringify(req.body));

    const {
      // si vienen en body, se respetan:
      dispositivo_id: dispFromBody = null,
      usuario_id: userFromBody = null,

      // payload del sensor (aceptamos ambos nombres)
      sensorId,
      h1, h2, h3, h4,
      humedad1, humedad2, humedad3, humedad4,
      humedadPromedio,
      CH4, NH3,
      temperatura,
      motor, servo, valvula, ventilador,
      servo1, servo2,
      ventilador1, ventilador2,
      electroval,
      fecha
    } = req.body || {};

    // 1) Resolver IDs
    let dispositivo_id = dispFromBody;
    let usuario_id = userFromBody;

    if (!dispositivo_id) {
      if (!sensorId) {
        return res.status(400).json({ ok: false, msg: 'Falta sensorId o dispositivo_id' });
      }
      const fromSensor = await resolverIdsPorSensorId(sensorId);
      if (!fromSensor) {
        return res.status(400).json({ ok: false, msg: 'sensorId no mapea a ningún dispositivo' });
      }
      dispositivo_id = fromSensor.dispositivo_id;
      usuario_id = usuario_id ?? fromSensor.usuario_id ?? null;
    }

    if (usuario_id == null) {
      usuario_id = await resolverUsuarioPorDispositivo(dispositivo_id);
    }
    if (usuario_id == null && process.env.DEFAULT_USUARIO_ID) {
      usuario_id = Number(process.env.DEFAULT_USUARIO_ID);
      console.warn('[INGESTA] usando DEFAULT_USUARIO_ID =', usuario_id);
    }
    if (usuario_id == null) {
      return res.status(400).json({ ok: false, msg: 'dispositivo_id no tiene usuario_id asignado' });
    }
    console.log('[INGESTA] usar dispositivo_id =', dispositivo_id, 'usuario_id =', usuario_id);

    // 2) Normalizar lectura al esquema de tu tabla
    const lectura = {
      dispositivo_id,
      usuario_id,
      h1: pickNum(h1, humedad1) ?? 0,
      h2: pickNum(h2, humedad2) ?? 0,
      h3: pickNum(h3, humedad3) ?? 0,
      h4: pickNum(h4, humedad4) ?? 0,
      humedadPromedio: pickNum(humedadPromedio) ?? 0,
      CH4: pickNum(CH4) ?? 0,
      NH3: pickNum(NH3) ?? 0,
      temperatura: pickNum(temperatura) ?? 0,
      motor: pickOnOff(motor) ?? 'OFF',
      servo: pickOnOff(servo, servo1) ?? 'OFF',          // -> servo1
      valvula: pickOnOff(valvula, electroval) ?? 'OFF',  // -> electroval
      ventilador: pickOnOff(ventilador, ventilador1) ?? 'OFF', // -> ventilador1
      fecha: fecha ? new Date(fecha) : new Date()
    };
    console.log('[INGESTA] lectura normalizada =', lectura);

    // 3) Guardar
    const id = await SensorModel.guardarLectura(lectura);
    console.log('[INGESTA] insert id =', id);

    // 4) Actualizar catálogo (última lectura)
    await db.query(
      `UPDATE sensores SET ultimaLectura = NOW(), activo = 1 WHERE dispositivo_id = ?`,
      [dispositivo_id]
    );

    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('[INGESTA][ERROR]', err.code, err.sqlMessage || err.message);
    return res.status(500).json({ ok: false, msg: 'Error guardando lectura' });
  }
};

/* ============================================
 * Listar lecturas (JWT)
 * ============================================ */
const listarLecturas = async (req, res) => {
  try {
    const { dispositivo_id, limit } = req.query;
    const rows = await SensorModel.obtenerLecturas({ dispositivo_id, limit });
    return res.json({ ok: true, datos: rows });
  } catch (err) {
    console.error('[LISTAR LECTURAS][ERROR]', err.code, err.sqlMessage || err.message);
    return res.status(500).json({ ok: false, msg: 'Error obteniendo lecturas' });
  }
};

module.exports = {
  crearSensor,
  listarSensores,
  actualizarSensor,
  eliminarSensor,
  ingestarLectura,
  listarLecturas
};
