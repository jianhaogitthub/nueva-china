// db.js — Configuración de la base de datos SQLite
// Inicializa la conexión y crea las tablas si no existen

const Database = require('better-sqlite3');
const path = require('path');

// Conexión a la base de datos (archivo único)
const db = new Database(path.join(__dirname, 'nueva-china.db'));

// Habilitar WAL mode para mejor rendimiento concurrente
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear tablas si no existen
function inicializarBD() {
  db.exec(`
    -- Categorías del menú
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT ''
    );

    -- Platos del menú
    CREATE TABLE IF NOT EXISTS platos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nombre_zh TEXT DEFAULT '',
      categoria_id INTEGER NOT NULL,
      precio INTEGER NOT NULL,
      descripcion TEXT DEFAULT '',
      imagen TEXT DEFAULT '',
      picante INTEGER NOT NULL DEFAULT 0,
      vegetariano INTEGER NOT NULL DEFAULT 0,
      disponible INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    -- Pedidos
    CREATE TABLE IF NOT EXISTS pedidos (
      id TEXT PRIMARY KEY,
      nombre_cliente TEXT NOT NULL,
      mesa TEXT DEFAULT '',
      direccion_entrega TEXT DEFAULT '',
      es_delivery INTEGER NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      total INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Items dentro de cada pedido
    CREATE TABLE IF NOT EXISTS items_pedido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id TEXT NOT NULL,
      plato_id INTEGER NOT NULL,
      nombre_plato TEXT NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 1,
      precio_unitario INTEGER NOT NULL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (plato_id) REFERENCES platos(id)
    );
  `);

  console.log('✅ Base de datos inicializada correctamente');
}

module.exports = { db, inicializarBD };
