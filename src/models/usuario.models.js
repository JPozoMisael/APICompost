const db = require('../db');
const bcrypt = require('bcryptjs');

/**
 * Roles válidos en tu sistema
 */
const ROLES_PERMITIDOS = ['ADMINISTRADOR', 'TECNICO', 'USUARIO'];

/**
 * Crear un nuevo usuario
 * Espera: { nombre, email, password, rol }
 * - password debe venir ya hasheado si tu flujo actual lo hace así.
 * - Si quieres hashear aquí, descomenta el hash.
 */
async function crear({ nombre, email, password, rol }) {
  const rolNormalizado = (rol || '').toUpperCase();
  if (!ROLES_PERMITIDOS.includes(rolNormalizado)) {
    throw new Error(`Rol no válido. Debe ser uno de: ${ROLES_PERMITIDOS.join(', ')}`);
  }

  // Si quieres hashear aquí:
  // const passwordHash = await bcrypt.hash(password, 10);
  const passwordHash = password;

  const sql = `
    INSERT INTO usuarios (nombre, email, password, rol)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [nombre, email, passwordHash, rolNormalizado]);
  return { id: result.insertId, nombre, email, rol: rolNormalizado };
}

/**
 * Listar todos (sin exponer password)
 */
const obtenerTodos = async () => {
  const [rows] = await db.query('SELECT id, nombre, email, rol FROM usuarios ORDER BY id DESC');
  return rows;
};

/**
 * Obtener por id (sin password)
 */
async function obtenerPorId(id) {
  const sql = `SELECT id, nombre, email, rol FROM usuarios WHERE id = ?`;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
}

/**
 * Obtener por email (incluye todo; útil para login)
 */
async function obtenerPorEmail(email) {
  const sql = `SELECT * FROM usuarios WHERE email = ?`;
  const [rows] = await db.query(sql, [email]);
  if (rows[0]) {
    rows[0].rol = (rows[0].rol || '').toUpperCase();
  }
  return rows[0] || null;
}

/**
 * Actualizar usuario de forma segura y dinámica.
 * Soporta: nombre, email, rol, password (ya hasheada opcionalmente),
 * y la bandera debe_cambiar_password si la usas.
 */
async function actualizar(id, datos = {}) {
  const campos = [];
  const valores = [];

  if (typeof datos.nombre !== 'undefined') {
    campos.push('nombre = ?');
    valores.push(datos.nombre);
  }
  if (typeof datos.email !== 'undefined') {
    campos.push('email = ?'); // ✅ antes había un bug que escribía 'rol'
    valores.push(datos.email);
  }
  if (typeof datos.rol !== 'undefined') {
    const rolNormalizado = (datos.rol || '').toUpperCase();
    if (!ROLES_PERMITIDOS.includes(rolNormalizado)) {
      throw new Error(`Rol no válido. Debe ser uno de: ${ROLES_PERMITIDOS.join(', ')}`);
    }
    campos.push('rol = ?');
    valores.push(rolNormalizado);
  }
  if (typeof datos.password !== 'undefined') {
    // Si te llega en claro, hashea aquí:
    // const hash = await bcrypt.hash(datos.password, 10);
    const hash = datos.password;
    campos.push('password = ?');
    valores.push(hash);
  }
  if (typeof datos.debe_cambiar_password !== 'undefined') {
    campos.push('debe_cambiar_password = ?');
    valores.push(datos.debe_cambiar_password ? 1 : 0);
  }

  if (campos.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  valores.push(id);
  const sql = `UPDATE usuarios SET ${campos.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await db.query(sql, valores);
  return result.affectedRows > 0;
}

/**
 * Eliminar usuario
 */
async function eliminar(id) {
  const sql = `DELETE FROM usuarios WHERE id = ?`;
  const [result] = await db.query(sql, [id]);
  return result.affectedRows > 0;
}

/**
 * ✅ Resetear contraseña (hash dentro del modelo)
 * - Genera hash de la contraseña temporal y setea debe_cambiar_password = 1 (si existe la columna).
 */
async function resetPassword(id, plainPassword) {
  const hash = await bcrypt.hash(String(plainPassword), 10);

  // Si tu tabla NO tiene 'debe_cambiar_password', quita esa parte del UPDATE.
  const sql = `
    UPDATE usuarios
    SET password = ?, debe_cambiar_password = 1, updated_at = NOW()
    WHERE id = ?
  `;
  const [result] = await db.query(sql, [hash, id]);
  return result.affectedRows > 0;
}

module.exports = {
  crear,
  obtenerPorId,
  obtenerPorEmail,
  obtenerTodos,
  actualizar,
  eliminar,
  resetPassword, // ✅ exportado
};
