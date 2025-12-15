const Usuario = require('../models/usuario.models');

/* Helpers */
const rolUp = (r) => (r || '').toUpperCase();
const isAdmin = (req) => rolUp(req.usuario?.rol) === 'ADMINISTRADOR';
const isOwner = (req, idParam = 'id') =>
  String(req.usuario?.id) === String(req.params?.[idParam]);

/**
 
 */
const getUsuarios = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ mensaje: 'No autorizado para ver todos los usuarios' });
    }
    const usuarios = await Usuario.obtenerTodos(); // sin password
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Obtener usuario por ID (admin cualquiera, usuario el suyo)
 */
const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isAdmin(req) && !isOwner(req, 'id')) {
      return res.status(403).json({ mensaje: 'No autorizado para ver este usuario' });
    }
    const usuario = await Usuario.obtenerPorId(id); // sin password
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 
 */
const crearUsuario = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ mensaje: 'No autorizado para crear usuarios' });
    }

    const payload = { ...req.body };
    if (payload.rol) payload.rol = rolUp(payload.rol);

    const nuevoUsuario = await Usuario.crear(payload); // hashea password en el modelo
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('Error al crear usuario:', error.message || error);
    res.status(500).json({ mensaje: 'Error al crear usuario', detalle: error.message });
  }
};

/**

 */
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = isAdmin(req);
    if (!admin && !isOwner(req, 'id')) {
      return res.status(403).json({ mensaje: 'No autorizado para actualizar este usuario' });
    }

    const cambios = { ...req.body };

    // Solo admin puede cambiar rol
    if (!admin && typeof cambios.rol !== 'undefined') {
      delete cambios.rol;
    } else if (admin && typeof cambios.rol !== 'undefined') {
      cambios.rol = rolUp(cambios.rol);
    }

    const actualizado = await Usuario.actualizar(id, cambios);
    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado o sin cambios' });
    }
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error.message || error);
    res.status(500).json({ mensaje: 'Error interno del servidor', detalle: error.message });
  }
};

/**
 * Eliminar usuario (solo ADMIN)
 */
const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ mensaje: 'No autorizado para eliminar usuarios' });
    }
    const eliminado = await Usuario.eliminar(id);
    if (!eliminado) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**

 */
const resetPassword = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ mensaje: 'No autorizado para restablecer contraseñas' });
    }
    const { id } = req.params;
    const tempPassword = req.body?.password || Math.random().toString(36).slice(-10);

    const ok = await Usuario.resetPassword(id, tempPassword);
    if (!ok) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    // En producción envía por correo; aquí retornamos para que el admin pueda mostrársela al usuario.
    res.json({ mensaje: 'Contraseña restablecida', tempPassword });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  resetPassword,
};
