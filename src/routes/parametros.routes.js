const express = require('express');
const router = express.Router();

const {
  getParametros,
  updateParametros,
} = require('../controllers/parametros.controller');

// GET /api/parametros-proceso
router.get('/', getParametros);

// PUT /api/parametros-proceso
router.put('/', updateParametros);

module.exports = router;
