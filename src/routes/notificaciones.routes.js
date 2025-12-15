// backend/src/routes/notificaciones.routes.js

const express = require('express');
const router = express.Router();
const NotificacionesController = require('../controllers/notificaciones.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.get(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  NotificacionesController.getNotificaciones
);

module.exports = router;