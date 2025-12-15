const express = require('express');
const router = express.Router();
const FuzzyController = require('../controllers/fuzzy.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Health sin auth (no toca DB)
router.get('/health', (req, res) => {
  return res.json({ ok: true, module: 'fuzzy', msg: 'ready' });
});

// Rutas protegidas
router.get(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  FuzzyController.getAccionesDifusas
);

router.get(
  '/:id',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO', 'USUARIO']),
  FuzzyController.getAccionPorId
);

router.post(
  '/',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO']),
  FuzzyController.insertarAccion
);

router.post(
  '/aplicar/:id',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO']),
  FuzzyController.aplicarAccionDifusa
);

module.exports = router;