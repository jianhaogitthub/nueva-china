// server.js — Servidor Express para Nueva China
// Sirve archivos estáticos, API REST, y autenticación

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { db, inicializarBD, crearAdminDefault } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos y admin
inicializarBD();
crearAdminDefault();

// Almacén de sesiones en memoria: token → { userId, username, rol }
const sesiones = new Map();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ MIDDLEWARE DE AUTENTICACIÓN ============

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Extraer token del header Authorization
function extraerToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// Middleware: requiere autenticación
function requiereAuth(req, res, next) {
  const token = extraerToken(req);
  if (!token || !sesiones.has(token)) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
  }
  req.user = sesiones.get(token);
  next();
}

// Middleware: requiere rol staff
function requiereStaff(req, res, next) {
  requiereAuth(req, res, () => {
    if (req.user.rol !== 'staff') {
      return res.status(403).json({ error: 'Acceso denegado. Solo personal autorizado.' });
    }
    next();
  });
}

// ============ API — AUTENTICACIÓN ============

// POST /api/login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const hash = hashPassword(password);
    const user = db.prepare('SELECT * FROM usuarios WHERE username = ? AND password_hash = ?').get(username, hash);

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = generarToken();
    sesiones.set(token, { userId: user.id, username: user.username, rol: user.rol });

    res.json({ token, username: user.username, rol: user.rol });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/session — Verificar sesión actual
app.get('/api/session', (req, res) => {
  const token = extraerToken(req);
  if (!token || !sesiones.has(token)) {
    return res.status(401).json({ error: 'Sin sesión activa' });
  }
  const user = sesiones.get(token);
  res.json({ username: user.username, rol: user.rol });
});

// POST /api/logout
app.post('/api/logout', requiereAuth, (req, res) => {
  const token = extraerToken(req);
  sesiones.delete(token);
  res.json({ mensaje: 'Sesión cerrada' });
});

// ============ API — USUARIOS (gestión) ============

// GET /api/usuarios — Listar usuarios (solo staff)
app.get('/api/usuarios', requiereStaff, (req, res) => {
  try {
    const usuarios = db.prepare('SELECT id, username, rol, creado_en FROM usuarios ORDER BY id').all();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/usuarios — Crear usuario (solo staff)
app.post('/api/usuarios', requiereStaff, (req, res) => {
  try {
    const { username, password, rol } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const existe = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
    if (existe) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const hash = hashPassword(password);
    db.prepare('INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)').run(
      username, hash, rol || 'staff'
    );

    res.status(201).json({ mensaje: 'Usuario creado exitosamente' });
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// PUT /api/usuarios/password — Cambiar contraseña propia
app.put('/api/usuarios/password', requiereAuth, (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;
    if (!password_actual || !password_nueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }
    if (password_nueva.length < 4) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
    }

    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.userId);
    const hashActual = hashPassword(password_actual);
    if (user.password_hash !== hashActual) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashNueva = hashPassword(password_nueva);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hashNueva, req.user.userId);
    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// DELETE /api/usuarios/:id — Eliminar usuario (solo staff)
app.delete('/api/usuarios/:id', requiereStaff, (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el último admin
    const count = db.prepare('SELECT COUNT(*) as c FROM usuarios WHERE rol = ?').get('staff');
    const target = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (target.rol === 'staff' && count.c <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el último administrador' });
    }
    // No permitir auto-eliminarse
    if (target.id === req.user.userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// ============ API — MENÚ (protegido para escritura) ============

// GET /api/menu — Público
app.get('/api/menu', (req, res) => {
  try {
    const categorias = db.prepare('SELECT * FROM categorias ORDER BY id').all();
    const platos = db.prepare('SELECT * FROM platos ORDER BY id').all();
    const menu = categorias.map(cat => ({
      id: cat.id, slug: cat.slug, nombre: cat.nombre, emoji: cat.emoji,
      platos: platos.filter(p => p.categoria_id === cat.id).map(p => ({
        id: p.id, nombre: p.nombre, nombreZh: p.nombre_zh,
        precio: p.precio, descripcion: p.descripcion, imagen: p.imagen,
        picante: p.picante === 1, vegetariano: p.vegetariano === 1, disponible: p.disponible === 1,
      })),
    })).filter(cat => cat.platos.length > 0);
    res.json(menu);
  } catch (err) {
    console.error('Error al obtener menú:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/menu — Staff only
app.post('/api/menu', requiereStaff, (req, res) => {
  try {
    const { nombre, nombre_zh, categoria_id, precio, descripcion, imagen, picante, vegetariano, disponible } = req.body;
    if (!nombre || !categoria_id || !precio) {
      return res.status(400).json({ error: 'Nombre, categoría y precio son obligatorios' });
    }
    const stmt = db.prepare(`INSERT INTO platos (nombre, nombre_zh, categoria_id, precio, descripcion, imagen, picante, vegetariano, disponible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const result = stmt.run(nombre, nombre_zh || '', categoria_id, precio, descripcion || '', imagen || '', picante ? 1 : 0, vegetariano ? 1 : 0, disponible !== false ? 1 : 0);
    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Plato creado exitosamente' });
  } catch (err) {
    console.error('Error al crear plato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/menu/:id — Staff only
app.put('/api/menu/:id', requiereStaff, (req, res) => {
  try {
    const { id } = req.params;
    const fields = []; const values = [];
    const allowedFields = ['nombre', 'nombre_zh', 'categoria_id', 'precio', 'descripcion', 'imagen', 'picante', 'vegetariano', 'disponible'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (['picante', 'vegetariano', 'disponible'].includes(field)) {
          values.push(req.body[field] ? 1 : 0);
        } else { values.push(req.body[field]); }
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
    values.push(id);
    const stmt = db.prepare(`UPDATE platos SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    if (result.changes === 0) return res.status(404).json({ error: 'Plato no encontrado' });
    res.json({ mensaje: 'Plato actualizado exitosamente' });
  } catch (err) { res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/menu/:id — Staff only
app.delete('/api/menu/:id', requiereStaff, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM platos WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Plato no encontrado' });
    res.json({ mensaje: 'Plato eliminado exitosamente' });
  } catch (err) { res.status(500).json({ error: 'Error interno' }); }
});

// ============ API — PEDIDOS (protegido para lectura/escritura staff) ============

// GET /api/pedidos — Staff/Delivery
app.get('/api/pedidos', requiereAuth, (req, res) => {
  try {
    const { estado, es_delivery } = req.query;
    let query = 'SELECT * FROM pedidos';
    const conditions = []; const params = [];
    if (estado) { conditions.push('estado = ?'); params.push(estado); }
    if (es_delivery !== undefined) { conditions.push('es_delivery = ?'); params.push(parseInt(es_delivery)); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY creado_en DESC';
    const pedidos = db.prepare(query).all(...params);
    const pedidosConItems = pedidos.map(p => {
      const items = db.prepare('SELECT * FROM items_pedido WHERE pedido_id = ?').all(p.id);
      return {
        id: p.id, nombre_cliente: p.nombre_cliente, mesa: p.mesa,
        direccion_entrega: p.direccion_entrega, es_delivery: p.es_delivery,
        estado: p.estado, total: p.total, creado_en: p.creado_en,
        items: items.map(i => ({ plato_id: i.plato_id, nombre_plato: i.nombre_plato, cantidad: i.cantidad, precio_unitario: i.precio_unitario })),
      };
    });
    res.json(pedidosConItems);
  } catch (err) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/pedidos — Público (clientes)
app.post('/api/pedidos', (req, res) => {
  try {
    const { nombre_cliente, mesa, es_delivery, direccion_entrega, items } = req.body;
    if (!nombre_cliente || !items || items.length === 0) {
      return res.status(400).json({ error: 'Nombre del cliente y al menos un item son obligatorios' });
    }
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = db.prepare("SELECT COUNT(*) as c FROM pedidos WHERE id LIKE 'ped-' || ? || '%'").get(hoy);
    const seq = String((count.c || 0) + 1).padStart(3, '0');
    const pedidoId = `ped-${hoy}-${seq}`;
    let total = 0; const itemsInsert = [];
    for (const item of items) {
      const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(item.plato_id);
      if (!plato) return res.status(400).json({ error: `Plato con ID ${item.plato_id} no encontrado` });
      itemsInsert.push({ plato_id: plato.id, nombre_plato: plato.nombre, cantidad: item.cantidad, precio_unitario: plato.precio });
      total += plato.precio * item.cantidad;
    }
    db.prepare(`INSERT INTO pedidos (id, nombre_cliente, mesa, es_delivery, direccion_entrega, estado, total, creado_en) VALUES (?, ?, ?, ?, ?, 'pendiente', ?, datetime('now', '-4 hours'))`).run(pedidoId, nombre_cliente, mesa || '', es_delivery ? 1 : 0, direccion_entrega || '', total);
    const insertItem = db.prepare('INSERT INTO items_pedido (pedido_id, plato_id, nombre_plato, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)');
    db.transaction(() => { for (const item of itemsInsert) insertItem.run(pedidoId, item.plato_id, item.nombre_plato, item.cantidad, item.precio_unitario); })();
    res.status(201).json({ id: pedidoId, mensaje: 'Pedido creado exitosamente', total });
  } catch (err) { res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/pedidos/:id — Staff/Delivery
app.put('/api/pedidos/:id', requiereAuth, (req, res) => {
  try {
    const { id } = req.params; const { estado } = req.body;
    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'en-camino', 'entregado', 'servido'];
    if (!estado || !estadosValidos.includes(estado)) return res.status(400).json({ error: `Estado inválido` });
    const result = db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: 'Estado actualizado exitosamente' });
  } catch (err) { res.status(500).json({ error: 'Error interno' }); }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ============ INICIAR ============
app.listen(PORT, () => {
  console.log(`🍜 Nueva China — Servidor iniciado en http://localhost:${PORT}`);
});
