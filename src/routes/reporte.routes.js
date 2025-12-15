const express = require('express');
const router = express.Router();
const reporteCtrl = require('../controllers/reporte.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Listar reportes (admin todos, usuario solo los suyos)
router.get(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  reporteCtrl.getReportes
);

// Ver reporte por ID
router.get(
  '/:id',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  reporteCtrl.getReporteById
);

// Crear reporte (admin y técnico)
router.post(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO']),
  reporteCtrl.crearReporte
);

// Eliminar reporte (admin cualquiera, usuario solo los suyos)
router.delete(
  '/:id',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  reporteCtrl.eliminarReporte
);

module.exports = router;