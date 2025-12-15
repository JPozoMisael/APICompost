const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario.models'); // tiene obtenerPorEmail, obtenerPorId, actualizar

const ROLES_PERMITIDOS = ['ADMINISTRADOR', 'TECNICO', 'USUARIO'];

/* ===== Registrar ===== */
const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'El email no es válido' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const rolNormalizado = String(rol).toUpperCase();
    if (!ROLES_PERMITIDOS.includes(rolNormalizado)) {
      return res.status(400).json({ message: 'Rol no permitido', roles: ROLES_PERMITIDOS });
    }

    const hashed = await bcrypt.hash(String(password), 10);
    await Usuario.crear({ nombre, email, password: hashed, rol: rolNormalizado });

    const u = await Usuario.obtenerPorEmail(email);
    const payload = { id: u.id, rol: u.rol, email: u.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' });

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
    });
  } catch (e) {
    console.error('Error en registrar:', e);
    return res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

/* ===== Login ===== */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const u = await Usuario.obtenerPorEmail(email);
    if (!u) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(String(password), String(u.password));
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const payload = { id: u.id, rol: u.rol, email: u.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' });

    return res.json({
      message: 'Login correcto',
      token,
      usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
    });
  } catch (e) {
    console.error('Error en login:', e);
    return res.status(500).json({ message: 'Error en el servidor al autenticar' });
  }
};

/* ===== Me (perfil desde BD) ===== */
const me = async (req, res) => {
  try {
    const { id } = req.usuario || {};
    if (!id) return res.status(401).json({ message: 'Token inválido' });

    const u = await Usuario.obtenerPorId(id); // no expone password
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });

    return res.json({
      id: u.id,
      nombre: u.nombre,
      correo: u.email, // el front espera 'correo'
      rol: (u.rol || '').toUpperCase(),
    });
  } catch (e) {
    console.error('me error:', e);
    return res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

/* ===== Actualizar perfil (nombre / correo) ===== */
const updateMe = async (req, res) => {
  try {
    const { id } = req.usuario || {};
    if (!id) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const { nombre, correo, email } = req.body || {};

    const cambios = {};

    if (typeof nombre === 'string' && nombre.trim()) {
      cambios.nombre = nombre.trim();
    }

    const correoFinal =
      (typeof correo === 'string' && correo.trim()
        ? correo.trim()
        : (typeof email === 'string' && email.trim()
            ? email.trim()
            : null));

    if (correoFinal) {
      cambios.email = correoFinal;
    }

    if (!Object.keys(cambios).length) {
      return res.status(400).json({ message: 'No hay datos para actualizar' });
    }

    const ok = await Usuario.actualizar(id, cambios);
    if (!ok) {
      return res
        .status(404)
        .json({ message: 'Usuario no encontrado o sin cambios' });
    }

    const u = await Usuario.obtenerPorId(id);

    return res.json({
      id: u.id,
      nombre: u.nombre,
      correo: u.email,
      email: u.email,
    });
  } catch (e) {
    console.error('updateMe error:', e);
    return res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

/* ===== Cambiar contraseña (usuario autenticado) ===== */
const changePassword = async (req, res) => {
  try {
    const { id, email } = req.usuario || {};
    if (!id || !email)
      return res.status(401).json({ message: 'Token inválido' });

    const actual =
      req.body.actual ??
      req.body.currentPassword ??
      req.body.oldPassword ??
      req.body.passwordActual;

    const nueva =
      req.body.nueva ??
      req.body.newPassword ??
      req.body.passwordNueva;

    if (!actual || !nueva)
      return res
        .status(400)
        .json({ message: 'actual y nueva son obligatorias' });
    if (String(nueva).length < 6)
      return res.status(400).json({
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      });

    // Trae hash actual
    const u = await Usuario.obtenerPorEmail(email);
    if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(
      String(actual),
      String(u.password || '')
    );
    if (!ok)
      return res
        .status(400)
        .json({ message: 'La contraseña actual no es correcta' });

    // Hashea nueva y actualiza
    const hash = await bcrypt.hash(String(nueva), 10);
    const updated = await Usuario.actualizar(u.id, { password: hash });
    if (!updated)
      return res
        .status(500)
        .json({ message: 'No se pudo actualizar la contraseña' });

    return res.json({ message: 'Contraseña actualizada' });
  } catch (e) {
    console.error('changePassword error:', e);
    return res.status(500).json({ message: 'Error al cambiar la contraseña' });
  }
};

/* ===== Recuperar contraseña (olvidé mi contraseña) ===== */
const recoverPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'El email es obligatorio' });
    }

    const u = await Usuario.obtenerPorEmail(email);
    if (!u) {
      // Para desarrollo puedes ser explícito
      return res.status(404).json({ message: 'No existe un usuario con ese email' });
    }

    // Genera una contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-10);

    // Usa el método del modelo que ya hashea y marca debe_cambiar_password
    const ok = await Usuario.resetPassword(u.id, tempPassword);
    if (!ok) {
      return res.status(500).json({ message: 'No se pudo resetear la contraseña' });
    }

    // Aquí lo ideal sería enviar un correo.
    // Por ahora devolvemos la contraseña temporal para pruebas.
    return res.json({
      message: 'Contraseña temporal generada correctamente.',
      tempPassword,
    });
  } catch (e) {
    console.error('recoverPassword error:', e);
    return res.status(500).json({ message: 'Error al procesar la recuperación de contraseña' });
  }
};

module.exports = {
  registrar,
  login,
  me,
  updateMe,
  changePassword,
  recoverPassword,
};
