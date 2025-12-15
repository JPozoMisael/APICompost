const express = require('express');
const router = express.Router();

const alertaController = require('../controllers/alerta.controller');
const { verificarToken } = require('../middleware/auth'); // Importa verificarToken

// GET /api/alertas  -> lista alertas
router.get('/', verificarToken, alertaController.getAlertas);

// POST /api/alertas -> crea alerta
router.post('/', verificarToken, alertaController.crearAlerta);

// PATCH /api/alertas/:id -> marcar como leída
router.patch('/:id', verificarToken, alertaController.marcarComoLeida);

// POST /api/dispositivos/tokens -> guardar token del dispositivo
router.post('/dispositivos/tokens', verificarToken, alertaController.guardarTokenDispositivo);

module.exports = router;