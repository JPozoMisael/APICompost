const express = require('express');
const router = express.Router();

const {
  obtenerConfig,
  actualizarConfig,
} = require('../controllers/config-sistema.controller');

// GET /api/config-sistema
router.get('/', obtenerConfig);

// PUT /api/config-sistema
router.put('/', actualizarConfig);

module.exports = router;
