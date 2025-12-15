const jwt = require('jsonwebtoken');

/** Verifica JWT y setea req.usuario */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado o mal formado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id, rol, email, ... }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

/** Lista blanca de roles */
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    const rol = req.usuario?.rol?.toUpperCase();
    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: 'Acceso denegado: rol no autorizado' });
    }
    next();
  };
};

/** Solo administradores */
const soloAdmin = (req, res, next) => {
  const rol = req.usuario?.rol?.toUpperCase();
  if (rol !== 'ADMINISTRADOR') {
    return res.status(403).json({message: 'Acceso denegado: sólo administradores' });
  }
  next();
};

/** Propietario (param id) o admin */
const propietarioOAdmin = (paramName = 'id') => (req,res, next) => {
  const rol = req.usuario?.rol?.toUpperCase();
  const isAdmin = rol === 'ADMINISTRADOR';
  const isOwner = String(req.usuario?.id) === String(req.params[paramName]);
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: 'Acceso denegado: no es propietario ni administrador' });
  }
  next();
};

module.exports = { verificarToken, verificarRol, soloAdmin, propietarioOAdmin };
