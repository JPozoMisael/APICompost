// routes/sensor.routes.js
const express = require('express');
const router = express.Router();

const sensorCtrl = require('../controllers/sensor.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');
const checkApiKey = require('../middleware/apikey');

// ===== Opcionales pero recomendados =====
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

// Límite de solicitudes para la ingesta (protege tu API)
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120,            // 120 lecturas por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
});

// Validación del payload de ingesta.
// OJO: tu DB tiene columnas humedad1..4, servo1, ventilador1, electroval.
// El controller ya mapea desde h1..h4, servo, ventilador, valvula.
// Permitimos campos extra con .unknown(true)
const lecturaSchema = Joi.object({
  // relacionar con tus catálogos (opcionales)
  dispositivo_id: Joi.number().integer().optional(),
  usuario_id: Joi.number().integer().optional(),

  // identificador lógico (topic/código) si lo envías
  sensorId: Joi.string().min(1).optional(),

  // medidas
  temperatura: Joi.number().optional(),
  h1: Joi.number().optional(),
  h2: Joi.number().optional(),
  h3: Joi.number().optional(),
  h4: Joi.number().optional(),
  humedadPromedio: Joi.number().optional(),
  CH4: Joi.number().optional(),
  NH3: Joi.number().optional(),

  // actuadores (aceptamos ON/OFF/boolean/1/0)
  motor: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional(),
  servo: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional(),
  valvula: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional(),
  ventilador: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional(),

  fecha: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
}).unknown(true);

// Middleware de validación
function validateLectura(req, res, next) {
  const { error } = lecturaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ ok: false, msg: error.message });
  }
  next();
}

/**
 * Ingesta IoT con API Key (sin JWT).
 * Front (Ionic/ESP32) envía header: x-api-key: <ADMIN_API_KEY>
 */
router.post(
  '/lecturas',
  checkApiKey,
  ingestLimiter,
  validateLectura,
  sensorCtrl.ingestarLectura
);

/**
 * Lecturas para dashboards (con JWT/roles).
 * Permite filtrar por ?dispositivo_id=...&limit=200
 */
router.get(
  '/lecturas',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  sensorCtrl.listarLecturas
);

// === CRUD de sensores (catálogo) ===
router.post(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO']),
  sensorCtrl.crearSensor
);

router.get(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  sensorCtrl.listarSensores
);

router.put(
  '/:id',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO']),
  sensorCtrl.actualizarSensor
);

router.delete(
  '/:id',
  verificarToken,
  verificarRol(['ADMINISTRADOR']),
  sensorCtrl.eliminarSensor
);

module.exports = router;
