// routes/health.routes.js
const express = require('express');
const router = express.Router();

// Si tienes un módulo de DB, impórtalo:
// const db = require('../db'); // ejemplo

// Si quieres chequear MQTT opcionalmente:
// const mqtt = require('mqtt');

router.get('/', async (req, res) => {
  const services = [];

  // API siempre UP si estás aquí
  services.push({ name: 'API', status: 'UP' });

  // Ejemplo de chequeo DB (ajusta a tu pool/knex/sequelize)
  try {
    // await db.ping(); // o un SELECT 1
    services.push({ name: 'Base de datos', status: 'UNKNOWN' }); // cambia a 'UP' si haces ping real
  } catch (e) {
    services.push({ name: 'Base de datos', status: 'DOWN', error: String(e?.message || e) });
  }

  // Ejemplo chequeo MQTT (rápido y opcional)
  // try {
  //   const host = process.env.MQTT_BROKER || 'broker.emqx.io';
  //   const port = Number(process.env.MQTT_PORT || 1883);
  //   services.push({ name: 'Broker MQTT', status: 'UNKNOWN', detail: `${host}:${port}` });
  // } catch (e) {
  //   services.push({ name: 'Broker MQTT', status: 'DOWN', error: String(e?.message || e) });
  // }

  res.json({ ok: true, services, ts: Date.now() });
});

module.exports = router;
