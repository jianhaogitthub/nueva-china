# Especificación de Diseño — Nueva China

## Identidad Visual

### Colores

| Nombre | Código Hex | Uso |
|--------|-----------|-----|
| Rojo principal | `#C41E3A` | Header, botones principales, badges, acentos |
| Rojo oscuro | `#A01830` | Hover de botones, bordes activos |
| Dorado | `#D4A017` | Íconos, bordes decorativos, precios |
| Crema de fondo | `#FFF8F0` | Fondo general de la página |
| Blanco | `#FFFFFF` | Tarjetas, modales, fondo de contenido |
| Gris oscuro | `#333333` | Texto principal |
| Gris medio | `#666666` | Texto secundario, descripciones |
| Gris claro | `#E5E5E5` | Bordes, separadores |
| Verde | `#2E7D32` | Badge "vegetariano", estado "entregado" |
| Naranja | `#E65100` | Badge "picante", estado "preparando" |
| Azul | `#1565C0` | Estado "en camino" |

### Tipografía
- **Sistema**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Usa las fuentes nativas del dispositivo para carga instantánea
- Tamaños: 14px (base), 12px (small), 18px (h3), 24px (h2), 32px (h1)

### Espaciado
- Base: 8px
- Padding de tarjetas: 16px
- Gap de grid: 16px
- Padding de página: 16px (móvil), 24px (tablet), 32px (desktop)

### Bordes y Sombras
- Radio de borde: 8px (tarjetas), 12px (modales), 4px (botones pequeños)
- Sombra de tarjetas: `0 2px 8px rgba(0,0,0,0.08)`
- Sombra de modal: `0 8px 32px rgba(0,0,0,0.15)`

---

## Componentes de UI

### Selector de Modo
- 3 tarjetas grandes con ícono emoji, título y descripción
- Centradas vertical y horizontalmente en la pantalla
- Hover: sombra más pronunciada, borde dorado

### Tarjeta de Plato
- Imagen (200×150px aprox)
- Nombre en español + nombre en chino debajo
- Precio en CLP (formato `$X.XXX`)
- Badges: picante 🔥, vegetariano 🥬
- Hover: levantar tarjeta (translateY -2px)

### Modal de Detalle de Plato
- Overlay oscuro semi-transparente
- Imagen grande del plato
- Nombre, descripción completa, precio
- Selector de cantidad (+ / −)
- Botón "Agregar al carrito" (rojo)

### Panel del Carrito (Slide-out)
- Se desliza desde la derecha
- Lista de items con nombre, cantidad, subtotal
- Botones +/− y eliminar por item
- Total al pie
- Botón "Hacer Pedido"

### Tabla de Pedidos (Staff)
- Columnas: ID, Cliente, Mesa/Delivery, Items, Total, Estado, Acción
- Badge de estado con color
- Fila expandible para ver detalle

### Formulario de Plato (Staff)
- Modal con campos: nombre, nombre chino, categoría (select), precio, descripción, imagen, picante (toggle), vegetariano (toggle), disponible (toggle)

### Tarjeta de Entrega (Reparto)
- Nº de pedido, dirección, items resumidos, estado actual
- Botones de acción según estado

---

## Responsive Breakpoints

| Breakpoint | Ancho | Layout |
|------------|-------|--------|
| Móvil | < 640px | 1 columna, carrito full-screen |
| Tablet | 640px – 1024px | 2 columnas en menú, carrito lateral |
| Desktop | > 1024px | 3 columnas en menú, carrito lateral 380px |

---

## Flujo de Navegación

```
[Selector de Modo]
    │
    ├── 🍽️ Cliente ──── [Menú por categorías] ─── [Detalle plato] ─── [Carrito] ─── [Checkout]
    │
    ├── 👨‍🍳 Personal ─── [Pestaña: Pedidos] ─── [Detalle pedido] ─── [Cambiar estado]
    │                 └── [Pestaña: Menú] ─── [Agregar/Editar/Eliminar plato]
    │
    └── 🛵 Reparto ─── [Entregas pendientes] ─── [Cambiar estado] ─── [Historial]
```
