// server.js — Servidor Express para Nueva China
// Sirve archivos estáticos y API REST

const express = require('express');
const path = require('path');
const { db, inicializarBD } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos
inicializarBD();

// Middleware para parsear JSON en las peticiones
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// ============ API ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ---------- MENÚ ----------

// GET /api/menu — Devuelve el menú agrupado por categorías
app.get('/api/menu', (req, res) => {
  try {
    const categorias = db.prepare('SELECT * FROM categorias ORDER BY id').all();
    const platos = db.prepare('SELECT * FROM platos ORDER BY id').all();

    const menu = categorias.map(cat => ({
      id: cat.id,
      slug: cat.slug,
      nombre: cat.nombre,
      emoji: cat.emoji,
      platos: platos
        .filter(p => p.categoria_id === cat.id)
        .map(p => ({
          id: p.id,
          nombre: p.nombre,
          nombreZh: p.nombre_zh,
          precio: p.precio,
          descripcion: p.descripcion,
          imagen: p.imagen,
          picante: p.picante === 1,
          vegetariano: p.vegetariano === 1,
          disponible: p.disponible === 1,
        })),
    })).filter(cat => cat.platos.length > 0);

    // Para el admin, incluir TODOS los platos incluso no disponibles
    res.json(menu);
  } catch (err) {
    console.error('Error al obtener menú:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/menu — Agregar nuevo plato
app.post('/api/menu', (req, res) => {
  try {
    const { nombre, nombre_zh, categoria_id, precio, descripcion, imagen, picante, vegetariano, disponible } = req.body;

    if (!nombre || !categoria_id || !precio) {
      return res.status(400).json({ error: 'Nombre, categoría y precio son obligatorios' });
    }

    const stmt = db.prepare(`
      INSERT INTO platos (nombre, nombre_zh, categoria_id, precio, descripcion, imagen, picante, vegetariano, disponible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre,
      nombre_zh || '',
      categoria_id,
      precio,
      descripcion || '',
      imagen || '',
      picante ? 1 : 0,
      vegetariano ? 1 : 0,
      disponible !== false ? 1 : 0
    );

    res.status(201).json({ id: result.lastInsertRowid, mensaje: 'Plato creado exitosamente' });
  } catch (err) {
    console.error('Error al crear plato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/menu/:id — Editar plato existente
app.put('/api/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fields = [];
    const values = [];

    const allowedFields = ['nombre', 'nombre_zh', 'categoria_id', 'precio', 'descripcion', 'imagen', 'picante', 'vegetariano', 'disponible'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        // Convertir booleanos a 0/1
        if (field === 'picante' || field === 'vegetariano' || field === 'disponible') {
          values.push(req.body[field] ? 1 : 0);
        } else {
          values.push(req.body[field]);
        }
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE platos SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Plato no encontrado' });
    }

    res.json({ mensaje: 'Plato actualizado exitosamente' });
  } catch (err) {
    console.error('Error al actualizar plato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/menu/:id — Eliminar plato
app.delete('/api/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM platos WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Plato no encontrado' });
    }

    res.json({ mensaje: 'Plato eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar plato:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ---------- PEDIDOS ----------

// GET /api/pedidos — Obtener pedidos (con filtros opcionales)
app.get('/api/pedidos', (req, res) => {
  try {
    const { estado, es_delivery } = req.query;

    let query = 'SELECT * FROM pedidos';
    const conditions = [];
    const params = [];

    if (estado) {
      conditions.push('estado = ?');
      params.push(estado);
    }
    if (es_delivery !== undefined) {
      conditions.push('es_delivery = ?');
      params.push(parseInt(es_delivery));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY creado_en DESC';

    const pedidos = db.prepare(query).all(...params);

    // Cargar items de cada pedido
    const pedidosConItems = pedidos.map(p => {
      const items = db.prepare('SELECT * FROM items_pedido WHERE pedido_id = ?').all(p.id);
      return {
        id: p.id,
        nombre_cliente: p.nombre_cliente,
        mesa: p.mesa,
        direccion_entrega: p.direccion_entrega,
        es_delivery: p.es_delivery,
        estado: p.estado,
        total: p.total,
        creado_en: p.creado_en,
        items: items.map(i => ({
          plato_id: i.plato_id,
          nombre_plato: i.nombre_plato,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        })),
      };
    });

    res.json(pedidosConItems);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/pedidos — Crear nuevo pedido
app.post('/api/pedidos', (req, res) => {
  try {
    const { nombre_cliente, mesa, es_delivery, direccion_entrega, items } = req.body;

    if (!nombre_cliente || !items || items.length === 0) {
      return res.status(400).json({ error: 'Nombre del cliente y al menos un item son obligatorios' });
    }

    // Generar ID
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = db.prepare("SELECT COUNT(*) as c FROM pedidos WHERE id LIKE 'ped-' || ? || '%'").get(hoy);
    const seq = String((count.c || 0) + 1).padStart(3, '0');
    const pedidoId = `ped-${hoy}-${seq}`;

    // Calcular total y validar platos
    let total = 0;
    const itemsInsert = [];

    for (const item of items) {
      const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(item.plato_id);
      if (!plato) {
        return res.status(400).json({ error: `Plato con ID ${item.plato_id} no encontrado` });
      }
      itemsInsert.push({
        plato_id: plato.id,
        nombre_plato: plato.nombre,
        cantidad: item.cantidad,
        precio_unitario: plato.precio,
      });
      total += plato.precio * item.cantidad;
    }

    // Insertar pedido
    const insertPedido = db.prepare(`
      INSERT INTO pedidos (id, nombre_cliente, mesa, es_delivery, direccion_entrega, estado, total, creado_en)
      VALUES (?, ?, ?, ?, ?, 'pendiente', ?, datetime('now', '-4 hours'))
    `);
    insertPedido.run(pedidoId, nombre_cliente, mesa || '', es_delivery ? 1 : 0, direccion_entrega || '', total);

    // Insertar items
    const insertItem = db.prepare(`
      INSERT INTO items_pedido (pedido_id, plato_id, nombre_plato, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertItems = db.transaction(() => {
      for (const item of itemsInsert) {
        insertItem.run(pedidoId, item.plato_id, item.nombre_plato, item.cantidad, item.precio_unitario);
      }
    });
    insertItems();

    res.status(201).json({ id: pedidoId, mensaje: 'Pedido creado exitosamente', total });
  } catch (err) {
    console.error('Error al crear pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/pedidos/:id — Actualizar estado de un pedido
app.put('/api/pedidos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'en-camino', 'entregado', 'servido'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
    }

    const stmt = db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?');
    const result = stmt.run(estado, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ mensaje: 'Estado actualizado exitosamente' });
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ INICIAR ============

app.listen(PORT, () => {
  console.log(`🍜 Nueva China — Servidor iniciado en http://localhost:${PORT}`);
});
