# Esquema de Base de Datos — Nueva China

**Motor**: SQLite 3  
**Archivo**: `nueva-china.db`  
**Librería**: better-sqlite3 (Node.js)

---

## Diagrama de Tablas

```
┌─────────────┐       ┌─────────────┐
│  categorias  │       │    platos    │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ categoria_id│
│ slug        │       │ id (PK)     │
│ nombre      │       │ nombre      │
│ emoji       │       │ nombre_zh   │
└─────────────┘       │ precio      │
                      │ descripcion │
                      │ imagen      │
                      │ picante     │
                      │ vegetariano │
                      │ disponible  │
                      └──────┬──────┘
                             │
┌─────────────┐       ┌──────┴──────┐
│   pedidos    │       │items_pedido │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ pedido_id   │
│ nombre_clte │       │ id (PK)     │
│ mesa        │       │ plato_id    │──┐
│ direccion   │       │ nombre_plato│  │
│ es_delivery │       │ cantidad    │  │
│ estado      │       │ precio_unit │  │
│ total       │       └─────────────┘  │
│ creado_en   │                        │
└─────────────┘       ┌────────────────┘
                      │ (FK lógica — referencial,
                      │  no se borra el plato si
                      │  está en un pedido)
```

---

## Tabla: `categorias`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identificador |
| `slug` | TEXT | NOT NULL, UNIQUE | Clave interna en minúsculas |
| `nombre` | TEXT | NOT NULL | Nombre visible en español |
| `emoji` | TEXT | NOT NULL, DEFAULT '' | Emoji representativo |

**Índices**: Ninguno adicional (id y slug ya son únicos).

---

## Tabla: `platos`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identificador único |
| `nombre` | TEXT | NOT NULL | Nombre del plato en español |
| `nombre_zh` | TEXT | DEFAULT '' | Nombre en caracteres chinos |
| `categoria_id` | INTEGER | NOT NULL, FK → categorias(id) | Categoría del plato |
| `precio` | INTEGER | NOT NULL | Precio en CLP (ej: 8990 = $8.990) |
| `descripcion` | TEXT | DEFAULT '' | Descripción del plato |
| `imagen` | TEXT | DEFAULT '' | Ruta relativa de la imagen |
| `picante` | INTEGER | NOT NULL, DEFAULT 0 | 1 = picante, 0 = no picante |
| `vegetariano` | INTEGER | NOT NULL, DEFAULT 0 | 1 = vegetariano, 0 = no |
| `disponible` | INTEGER | NOT NULL, DEFAULT 1 | 1 = disponible hoy, 0 = agotado |

**Índices**: `CREATE INDEX idx_platos_categoria ON platos(categoria_id);`

**Nota**: `precio` es INTEGER. Para mostrar, se formatea con separador de miles: `$8.990`.

---

## Tabla: `pedidos`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | TEXT | PRIMARY KEY | ID único, formato `ped-YYYYMMDD-XXX` |
| `nombre_cliente` | TEXT | NOT NULL | Nombre de quien pide |
| `mesa` | TEXT | DEFAULT '' | Nº de mesa (si aplica) |
| `direccion_entrega` | TEXT | DEFAULT '' | Dirección (si es delivery) |
| `es_delivery` | INTEGER | NOT NULL, DEFAULT 0 | 1 = delivery, 0 = comer en local |
| `estado` | TEXT | NOT NULL, DEFAULT 'pendiente' | Estado actual del pedido |
| `total` | INTEGER | NOT NULL, DEFAULT 0 | Total del pedido en CLP |
| `creado_en` | TEXT | NOT NULL, DEFAULT datetime('now') | Timestamp ISO 8601 |

**Índices**:
- `CREATE INDEX idx_pedidos_estado ON pedidos(estado);`
- `CREATE INDEX idx_pedidos_delivery ON pedidos(es_delivery);`

**Estados válidos**:

```
pendiente → confirmado → preparando → listo
                                         ├── (local) → servido
                                         └── (delivery) → en-camino → entregado
```

---

## Tabla: `items_pedido`

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identificador |
| `pedido_id` | TEXT | NOT NULL, FK → pedidos(id) | Pedido al que pertenece |
| `plato_id` | INTEGER | NOT NULL, FK → platos(id) | Plato pedido |
| `nombre_plato` | TEXT | NOT NULL | Nombre del plato al momento del pedido |
| `cantidad` | INTEGER | NOT NULL, DEFAULT 1 | Cantidad pedida |
| `precio_unitario` | INTEGER | NOT NULL | Precio del plato al momento del pedido |

**Índices**: `CREATE INDEX idx_items_pedido ON items_pedido(pedido_id);`

---

## Convenciones

- **IDs**: Los platos y categorías usan INTEGER autoincremental. Los pedidos usan TEXT con formato `ped-YYYYMMDD-XXX`.
- **Precios**: Siempre en INTEGER (pesos chilenos). El formateo con puntos de miles se hace en el frontend.
- **Booleanos**: INTEGER 0/1 (SQLite no tiene tipo booleano nativo).
- **Timestamps**: Formato ISO 8601 en TEXT (SQLite no tiene tipo datetime nativo).
- **Foreign Keys**: Habilitadas con `PRAGMA foreign_keys = ON`. Sin embargo, al eliminar un plato que ya fue pedido, se conserva el registro en `items_pedido` con el nombre y precio del momento.
