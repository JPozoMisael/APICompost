const ParametrosModel = require('../models/parametros.model');


async function getParametros(req, res) {
  try {
    const row = await ParametrosModel.getParametros();

    if (!row) {
      // Si no hay fila, devolvemos los valores por defecto
      return res.json({
        ok: true,
        data: {
          tempMin: 50,
          tempMax: 65,
          humMin: 40,
          humMax: 70,
          gasUmbral: 800,

          autoVentilador: true,
          ventMinOn: 30,
          ventMinOff: 120,
          autoVolteo: true,
          volteoHoras: 24,

          muestreoSegundos: 60,
          envioMinutos: 5,
          bufferMax: 200,

          notificarCriticas: true,
          notificarInformativas: false,
          canalNotificacion: 'app',
          updated_at: null,
        },
      });
    }

    // Adaptamos nombres snake_case -> camelCase
    const data = {
      tempMin: Number(row.temp_min),
      tempMax: Number(row.temp_max),
      humMin: Number(row.hum_min),
      humMax: Number(row.hum_max),
      gasUmbral: Number(row.gas_umbral),

      autoVentilador: !!row.auto_ventilador,
      ventMinOn: Number(row.vent_min_on),
      ventMinOff: Number(row.vent_min_off),
      autoVolteo: !!row.auto_volteo,
      volteoHoras: Number(row.volteo_horas),

      muestreoSegundos: Number(row.muestreo_segundos),
      envioMinutos: Number(row.envio_minutos),
      bufferMax: Number(row.buffer_max),

      notificarCriticas: !!row.notificar_criticas,
      notificarInformativas: !!row.notificar_informativas,
      canalNotificacion: row.canal_notificacion || 'app',
      updated_at: row.updated_at || null,
    };

    return res.json({ ok: true, data });
  } catch (err) {
    console.error('[parametros.controller] getParametros error', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener parámetros del proceso',
    });
  }
}

// PUT /api/parametros
async function updateParametros(req, res) {
  try {
    const body = req.body || {};

    // Tomamos del body y aplicamos defaults
    const payload = {
      tempMin: Number(body.tempMin ?? 50),
      tempMax: Number(body.tempMax ?? 65),
      humMin: Number(body.humMin ?? 40),
      humMax: Number(body.humMax ?? 70),
      gasUmbral: Number(body.gasUmbral ?? 800),

      autoVentilador:
        typeof body.autoVentilador === 'boolean'
          ? body.autoVentilador
          : true,
      ventMinOn: Number(body.ventMinOn ?? 30),
      ventMinOff: Number(body.ventMinOff ?? 120),
      autoVolteo:
        typeof body.autoVolteo === 'boolean'
          ? body.autoVolteo
          : true,
      volteoHoras: Number(body.volteoHoras ?? 24),

      muestreoSegundos: Number(body.muestreoSegundos ?? 60),
      envioMinutos: Number(body.envioMinutos ?? 5),
      bufferMax: Number(body.bufferMax ?? 200),

      notificarCriticas:
        typeof body.notificarCriticas === 'boolean'
          ? body.notificarCriticas
          : true,
      notificarInformativas:
        typeof body.notificarInformativas === 'boolean'
          ? body.notificarInformativas
          : false,
      canalNotificacion: body.canalNotificacion || 'app',
    };

    const saved = await ParametrosModel.upsertParametros(payload);

    return res.json({
      ok: true,
      data: saved,
    });
  } catch (err) {
    console.error('[parametros.controller] updateParametros error', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar parámetros del proceso',
    });
  }
}

module.exports = {
  getParametros,
  updateParametros,
};
