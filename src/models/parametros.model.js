const db = require('../db');

async function getParametros() {
  const [rows] = await db.execute(
    'SELECT * FROM parametros_proceso ORDER BY id LIMIT 1'
  );
  return rows[0] || null;
}

async function upsertParametros(p) {

  const [rows] = await db.execute(
    'SELECT id FROM parametros_proceso ORDER BY id LIMIT 1'
  );
  let id = rows[0]?.id ?? null;

  const valoresBase = [
    Number(p.tempMin),
    Number(p.tempMax),
    Number(p.humMin),
    Number(p.humMax),
    Number(p.gasUmbral),

    p.autoVentilador ? 1 : 0,
    Number(p.ventMinOn),
    Number(p.ventMinOff),
    p.autoVolteo ? 1 : 0,
    Number(p.volteoHoras),

    Number(p.muestreoSegundos),
    Number(p.envioMinutos),
    Number(p.bufferMax),

    p.notificarCriticas ? 1 : 0,
    p.notificarInformativas ? 1 : 0,
    p.canalNotificacion || 'app',
  ];

  if (!id) {
    // INSERT
    const sqlInsert = `
      INSERT INTO parametros_proceso (
        temp_min, temp_max,
        hum_min, hum_max,
        gas_umbral,
        auto_ventilador, vent_min_on, vent_min_off,
        auto_volteo, volteo_horas,
        muestreo_segundos, envio_minutos, buffer_max,
        notificar_criticas, notificar_informativas,
        canal_notificacion,
        updated_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, NOW())
    `;
    const [result] = await db.execute(sqlInsert, valoresBase);
    id = result.insertId;
  } else {
    
    const sqlUpdate = `
      UPDATE parametros_proceso
      SET
        temp_min = ?,
        temp_max = ?,
        hum_min = ?,
        hum_max = ?,
        gas_umbral = ?,
        auto_ventilador = ?,
        vent_min_on = ?,
        vent_min_off = ?,
        auto_volteo = ?,
        volteo_horas = ?,
        muestreo_segundos = ?,
        envio_minutos = ?,
        buffer_max = ?,
        notificar_criticas = ?,
        notificar_informativas = ?,
        canal_notificacion = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    await db.execute(sqlUpdate, [...valoresBase, id]);
  }

  const [rowsFinal] = await db.execute(
    'SELECT * FROM parametros_proceso WHERE id = ?',
    [id]
  );
  return rowsFinal[0] || null;
}

module.exports = {
  getParametros,
  upsertParametros,
};
