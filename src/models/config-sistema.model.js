const pool = require('../db.js'); 
async function getConfigSistema() {
  const [rows] = await pool.query('SELECT * FROM config_sistema LIMIT 1');
  return rows[0] || null;
}

async function upsertConfigSistema(data, usuario) {
  // Cargar registro actual (si existe)
  const actual = await getConfigSistema();

  const payload = {
    tema: data.tema || 'auto',
    tamFuente: data.tamFuente || 'normal',
    reducirAnimaciones: data.reducirAnimaciones ? 1 : 0,

    email: data.email ? 1 : 0,
    push: data.push ? 1 : 0,
    sms: data.sms ? 1 : 0,

    alertasCriticas: data.alertasCriticas ? 1 : 0,
    alertasProceso: data.alertasProceso ? 1 : 0,
    alertasInformativas: data.alertasInformativas ? 1 : 0,

    resumenFrecuencia: data.resumenFrecuencia || 'semanal',
  };

  if (actual) {
    // UPDATE
    await pool.query(
      `UPDATE config_sistema
       SET tema=?, tamFuente=?, reducirAnimaciones=?,
           email=?, push=?, sms=?,
           alertasCriticas=?, alertasProceso=?, alertasInformativas=?,
           resumenFrecuencia=?,
           updated_at=NOW()
       WHERE id=?`,
      [
        payload.tema,
        payload.tamFuente,
        payload.reducirAnimaciones,
        payload.email,
        payload.push,
        payload.sms,
        payload.alertasCriticas,
        payload.alertasProceso,
        payload.alertasInformativas,
        payload.resumenFrecuencia,
        actual.id,
      ]
    );
  } else {
    // INSERT
    await pool.query(
      `INSERT INTO config_sistema (
        tema, tamFuente, reducirAnimaciones,
        email, push, sms,
        alertasCriticas, alertasProceso, alertasInformativas,
        resumenFrecuencia, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,NOW())`,
      [
        payload.tema,
        payload.tamFuente,
        payload.reducirAnimaciones,
        payload.email,
        payload.push,
        payload.sms,
        payload.alertasCriticas,
        payload.alertasProceso,
        payload.alertasInformativas,
        payload.resumenFrecuencia,
      ]
    );
  }

  // Devolver versión actualizada
  const nueva = await getConfigSistema();
  return nueva;
}

module.exports = {
  getConfigSistema,
  upsertConfigSistema,
};
