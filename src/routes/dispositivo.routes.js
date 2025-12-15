const express = require('express');
const router = express.Router();
const { getDispositivos, crearDispositivo } = require('../controllers/dispositivo.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// ✅ Obtener dispositivos
router.get(
  '/dispositivos',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  getDispositivos
);

// ✅ Crear dispositivo (todos pueden)
router.post(
  '/dispositivos',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  crearDispositivo
);

module.exports = router;