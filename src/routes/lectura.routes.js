const express = require('express');
const router = express.Router();
const { crearLectura, getLecturas } = require('../controllers/lectura.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// ✅ Obtener lecturas
router.get(
  '/lecturas',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  getLecturas
);

// ✅ Crear nueva lectura (pueden todos, pero ligada al dispositivo del usuario)
router.post(
  '/lecturas',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  crearLectura
);

module.exports = router;