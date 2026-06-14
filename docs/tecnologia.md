# Especificación Técnica — Nueva China

## Arquitectura General

```
Navegador (Cliente/Personal/Repartidor)
       │
       │ HTTP (REST API + archivos estáticos)
       ▼
┌─────────────────────────────────┐
│  Node.js + Express (server.js)  │
│  ┌───────────────────────────┐  │
│  │  API REST (/api/*)        │  │
│  │  - Menú                   │  │
│  │  - Pedidos                │  │
│  └───────────┬───────────────┘  │
│              │                   │
│  ┌───────────▼───────────────┐  │
│  │  SQLite (better-sqlite3)  │  │
│  │  Archivo: nueva-china.db  │  │
│  └───────────────────────────┘  │
│                                 │
│  Archivos estáticos (/public)   │
└─────────────────────────────────┘
```

## Stack y Versiones

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Runtime | Node.js | ≥ 18.x |
| Servidor | Express | ^4.21.0 |
| Base de datos | SQLite (better-sqlite3) | ^11.6.0 |
| Frontend | HTML5 + CSS3 + ES6 | Nativo del navegador |
| Hosting | Render.com | Plan gratuito |

## Por qué estas elecciones

### Node.js + Express
- Un solo lenguaje (JavaScript) en frontend y backend
- Express es el servidor web más usado en Node.js — mucha documentación
- Ligero y rápido para una aplicación de este tamaño

### SQLite + better-sqlite3
- **Cero configuración**: no requiere instalar PostgreSQL ni MySQL
- **Un solo archivo**: la base de datos completa es `nueva-china.db`
- **Persistente**: los datos sobreviven reinicios del servidor
- **Rápido**: para el volumen de datos de un restaurante, SQLite es más que suficiente
- better-sqlite3 es síncrono — código más simple, ideal para este proyecto

### HTML + CSS + JavaScript Vanilla
- **Sin dependencias**: no necesita React, Vue, ni Angular
- **Sin build step**: no necesita Webpack, Vite, ni compilación
- **Carga instantánea**: archivos pequeños, sin overhead de framework
- **Fácil de mantener**: para alguien sin experiencia en código, HTML/CSS/JS simple es más abordable

### Render.com
- Plan gratuito que soporta Node.js
- Despliegue automático desde GitHub
- Certificado SSL (HTTPS) incluido
- Dominio `*.onrender.com` gratis
