const express = require('express');
const router = express.Router();
const { crearAccion, getAcciones } = require('../controllers/accion.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// ✅ Obtener historial de acciones
router.get(
  '/acciones',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'INVESTIGADOR', 'USUARIO']),
  getAcciones
);

// ✅ Registrar nueva acción
router.post(
  '/acciones',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'INVESTIGADOR', 'USUARIO']),
  crearAccion
);

module.exports = router;