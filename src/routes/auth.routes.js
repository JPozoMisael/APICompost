const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const {
  registrar,
  login,
  me,
  updateMe,
  changePassword,
  recoverPassword,   // <- NUEVO
} = require('../controllers/auth.controller');

const { verificarToken, verificarRol } = require('../middleware/auth');

/* ===================== RUTAS PÚBLICAS ===================== */
router.post('/register', registrar);
router.post('/login', login);
router.post('/recover', recoverPassword);   // <- NUEVA RUTA (sin token)

/* ============== DEMOS POR ROL (puedes dejarlas) ============= */
router.post(
  '/admin/panel',
  verificarToken,
  verificarRol(['ADMINISTRADOR']),
  (req, res) => {
    res.json({ message: 'Bienvenido al panel de administrador' });
  }
);

router.get(
  '/tecnico/sensores',
  verificarToken,
  verificarRol(['TECNICO']),
  (req, res) => {
    res.json({ message: 'Bienvenido al panel de técnico' });
  }
);

router.get(
  '/usuario/perfil',
  verificarToken,
  verificarRol(['USUARIO']),
  (req, res) => {
    res.json({
      message: `Hola usuario ${req.usuario.id}, este es tu perfil.`,
    });
  }
);

router.get(
  '/datos-sensores',
  verificarToken,
  verificarRol(['ADMINISTRADOR', 'TECNICO']),
  (req, res) => {
    res.json({ message: 'Acceso a datos de sensores permitido' });
  }
);

/* ===================== PERFIL / SEGURIDAD ===================== */
router.get('/me', verificarToken, me);
router.put('/me', verificarToken, updateMe);
router.post('/change-password', verificarToken, changePassword);

/** Estado de seguridad (simple en memoria; cambia a tu BD si quieres) */
let securityState = { twoFA: true, ocultarCorreo: true, dispositivos: 1 };

router.get('/security', verificarToken, (req, res) => {
  res.json(securityState);
});

router.patch('/security', verificarToken, (req, res) => {
  const { twoFA, ocultarCorreo } = req.body || {};
  if (typeof twoFA === 'boolean') securityState.twoFA = twoFA;
  if (typeof ocultarCorreo === 'boolean')
    securityState.ocultarCorreo = ocultarCorreo;
  return res.json({ ok: true, ...securityState });
});

/* ===================== SUBIDA DE AVATAR ===================== */
// Recuerda servir estáticos en app.js:
// app.use('/static', express.static(path.join(__dirname, 'static')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'static', 'avatars'));
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const uid =
      req.usuario && req.usuario.id ? `u${req.usuario.id}` : 'u';
    cb(null, `${uid}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(
      file.mimetype
    );
    cb(ok ? null : new Error('Formato no permitido'));
  },
});

/** Subir avatar: campo 'avatar' (multipart/form-data) */
router.post(
  '/avatar',
  verificarToken,
  upload.single('avatar'),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ message: 'Archivo requerido' });

    const url = `${req.protocol}://${req.get('host')}/static/avatars/${
      req.file.filename
    }`;

    // TODO: persiste en BD si tienes columna avatar
    // await Usuario.actualizar(req.usuario.id, { avatar: url });

    return res.json({ url });
  }
);

module.exports = router;
