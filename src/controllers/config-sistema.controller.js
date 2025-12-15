const {
  getConfigSistema,
  upsertConfigSistema,
} = require('../models/config-sistema.model');

async function obtenerConfig(req, res) {
  try {
    const cfg = await getConfigSistema();
    if (!cfg) {
      // Si no hay registro, respondemos con valores por defecto coherentes
      return res.json({
        tema: 'auto',
        tamFuente: 'normal',
        reducirAnimaciones: false,
        email: 1,
        push: 1,
        sms: 0,
        alertasCriticas: 1,
        alertasProceso: 1,
        alertasInformativas: 1,
        resumenFrecuencia: 'semanal',
        updated_at: null,
      });
    }

    // Normalizar de 0/1 a booleanos
    const respuesta = {
      tema: cfg.tema,
      tamFuente: cfg.tamFuente,
      reducirAnimaciones: !!cfg.reducirAnimaciones,

      email: !!cfg.email,
      push: !!cfg.push,
      sms: !!cfg.sms,

      alertasCriticas: !!cfg.alertasCriticas,
      alertasProceso: !!cfg.alertasProceso,
      alertasInformativas: !!cfg.alertasInformativas,

      resumenFrecuencia: cfg.resumenFrecuencia,
      updated_at: cfg.updated_at,
    };

    res.json(respuesta);
  } catch (err) {
    console.error('[ConfigSistema] Error al obtener configuración:', err);
    res.status(500).json({ message: 'Error al obtener configuración del sistema' });
  }
}

async function actualizarConfig(req, res) {
  try {
    const data = req.body || {};
    const usuario = data.usuario || 'desconocido';

    const cfg = await upsertConfigSistema(data, usuario);

    const respuesta = {
      tema: cfg.tema,
      tamFuente: cfg.tamFuente,
      reducirAnimaciones: !!cfg.reducirAnimaciones,

      email: !!cfg.email,
      push: !!cfg.push,
      sms: !!cfg.sms,

      alertasCriticas: !!cfg.alertasCriticas,
      alertasProceso: !!cfg.alertasProceso,
      alertasInformativas: !!cfg.alertasInformativas,

      resumenFrecuencia: cfg.resumenFrecuencia,
      updated_at: cfg.updated_at,
    };

    res.json(respuesta);
  } catch (err) {
    console.error('[ConfigSistema] Error al actualizar configuración:', err);
    res.status(500).json({ message: 'Error al actualizar configuración del sistema' });
  }
}

module.exports = {
  obtenerConfig,
  actualizarConfig,
};
