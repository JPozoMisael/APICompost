// routes/logs.routes.js
const express = require('express');
const router = express.Router();
const LogsController = require('../controllers/logs.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Listar (ADMIN)
router.get(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR']),
  LogsController.obtenerLogs
);

// Crear (cualquier autenticado)
router.post(
  '/',
  verificarToken,
  // no hace falta verificarRol aquí; basta con tener token
  LogsController.crearLog
);

module.exports = router;
