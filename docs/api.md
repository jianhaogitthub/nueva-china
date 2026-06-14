# Documentación de API — Nueva China

Base URL: `http://localhost:3000/api` (desarrollo) | `https://nueva-china.onrender.com/api` (producción)

## Endpoints

### Salud

#### `GET /api/health`
Verifica que el servidor esté funcionando.

**Respuesta** (200):
```json
{ "ok": true, "timestamp": "2026-06-14T..." }
```

---

### Menú

#### `GET /api/menu`
Devuelve el menú completo agrupado por categorías. Solo incluye platos marcados como disponibles.

**Respuesta** (200):
```json
[
  {
    "id": 1,
    "slug": "especialidades",
    "nombre": "Especialidades del Chef",
    "emoji": "⭐",
    "platos": [
      {
        "id": 1,
        "nombre": "Pollo Kung Pao",
        "nombreZh": "宫保鸡丁",
        "precio": 8990,
        "descripcion": "Pollo salteado con maní...",
        "imagen": "imagenes/pollo-kung-pao.jpg",
        "picante": true,
        "vegetariano": false,
        "disponible": true
      }
    ]
  }
]
```

> **Nota**: Los precios están en pesos chilenos (CLP). Dividir por 1 para obtener el valor. Formatear como `$X.XXX`.

---

### Menú (Gestión — requiere modo Personal)

#### `POST /api/menu`
Agregar un nuevo plato.

**Body**:
```json
{
  "nombre": "Arroz Tres Delicias",
  "nombreZh": "三鲜炒饭",
  "categoria_id": 5,
  "precio": 6490,
  "descripcion": "Arroz frito con camarones, jamón y huevo",
  "imagen": "imagenes/arroz-tres-delicias.jpg",
  "picante": false,
  "vegetariano": false,
  "disponible": true
}
```

**Respuesta** (201): `{ "id": 22, "mensaje": "Plato creado exitosamente" }`

---

#### `PUT /api/menu/:id`
Editar un plato existente.

**Body** (parcial — solo los campos a modificar):
```json
{ "precio": 6990, "disponible": false }
```

**Respuesta** (200): `{ "mensaje": "Plato actualizado exitosamente" }`

---

#### `DELETE /api/menu/:id`
Eliminar un plato.

**Respuesta** (200): `{ "mensaje": "Plato eliminado exitosamente" }`

---

### Pedidos

#### `GET /api/pedidos`
Obtener pedidos. Soporta filtros opcionales por query string.

**Parámetros opcionales**:
| Param | Tipo | Descripción |
|-------|------|-------------|
| `estado` | string | Filtrar por estado (ej: `pendiente`) |
| `es_delivery` | 0/1 | Filtrar solo delivery o solo local |

**Ejemplo**: `GET /api/pedidos?estado=pendiente&es_delivery=1`

**Respuesta** (200):
```json
[
  {
    "id": "ped-20260614-001",
    "nombre_cliente": "María",
    "mesa": "B5",
    "direccion_entrega": "",
    "es_delivery": 0,
    "estado": "pendiente",
    "total": 17480,
    "creado_en": "2026-06-14T14:30:00-04:00",
    "items": [
      {
        "plato_id": 1,
        "nombre_plato": "Pollo Kung Pao",
        "cantidad": 2,
        "precio_unitario": 8990
      }
    ]
  }
]
```

---

#### `POST /api/pedidos`
Crear un nuevo pedido.

**Body**:
```json
{
  "nombre_cliente": "María",
  "mesa": "B5",
  "es_delivery": false,
  "direccion_entrega": "",
  "items": [
    { "plato_id": 1, "cantidad": 2 },
    { "plato_id": 7, "cantidad": 1 }
  ]
}
```

**Respuesta** (201):
```json
{
  "id": "ped-20260614-001",
  "mensaje": "Pedido creado exitosamente"
}
```

---

#### `PUT /api/pedidos/:id`
Actualizar el estado de un pedido.

**Body**:
```json
{ "estado": "confirmado" }
```

**Respuesta** (200): `{ "mensaje": "Estado actualizado exitosamente" }`

**Estados válidos**: `pendiente`, `confirmado`, `preparando`, `listo`, `en-camino`, `entregado`, `servido`
