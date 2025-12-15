const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

// Listar todos (solo ADMIN)
router.get('/', verificarToken, verificarRol(['ADMINISTRADOR']), usuarioCtrl.getUsuarios);

// Ver un usuario (ADMIN puede todos, los demás solo el suyo)
router.get('/:id', verificarToken, usuarioCtrl.getUsuarioById);

// Crear usuario (solo ADMIN)
router.post('/', verificarToken, verificarRol(['ADMINISTRADOR']), usuarioCtrl.crearUsuario);

// Actualizar usuario (ADMIN cualquiera, usuario solo el suyo)
router.put('/:id', verificarToken, usuarioCtrl.actualizarUsuario);

// Eliminar usuario (solo ADMIN)
router.delete('/:id', verificarToken, verificarRol(['ADMINISTRADOR']), usuarioCtrl.eliminarUsuario);

// Reset de contraseña (solo ADMIN)
router.post('/:id/reset-password', verificarToken, verificarRol(['ADMINISTRADOR']), usuarioCtrl.resetPassword);

module.exports = router;
