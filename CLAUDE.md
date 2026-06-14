# Nueva China — Guías de Desarrollo

## Sobre el Proyecto
Aplicación web para el restaurante **"Nueva China"** (Chile). Permite a clientes explorar el menú y hacer pedidos, al personal gestionar pedidos y el menú, y a repartidores hacer seguimiento de entregas.

## Stack Tecnológico
- **Servidor**: Node.js + Express
- **Base de datos**: SQLite (better-sqlite3)
- **Frontend**: HTML + CSS + JavaScript vanilla (sin frameworks)
- **Hosting**: Render.com (plan gratuito)

## Rutas Estándar
| Propósito | Ruta |
|-----------|------|
| Servidor principal | `server.js` |
| Configuración BD | `db.js` |
| Datos semilla | `seed.js` |
| Frontend (HTML) | `public/index.html` |
| Estilos | `public/css/estilo.css` |
| Lógica del frontend | `public/js/*.js` |
| Imágenes de platos | `public/imagenes/` |
| Documentación | `docs/` |
| Registro de desarrollo | `dev-log/` |

## Convenciones de Código
- **Idioma**: Todo el texto de interfaz y comentarios en español
- **Moneda**: Peso chileno (CLP), formato `$X.XXX`
- **Nombres de archivos**: minúsculas, sin espacios, guiones para separar palabras
- **Variables y funciones**: camelCase en JavaScript
- **Nombres de tablas/columnas SQL**: snake_case
- **IDs de pedidos**: formato `ped-YYYYMMDD-XXX` (ej: `ped-20260614-001`)

## Flujo de Trabajo
1. Completar una fase antes de empezar la siguiente
2. Probar cada tarea manualmente antes de marcarla como completada
3. Actualizar `dev-log/YYYY-MM-DD.md` al final de cada sesión de desarrollo
4. No modificar archivos de documentación sin registrar el cambio en el dev-log
5. Commits pequeños y frecuentes (un commit por tarea completada)
6. Mantener el servidor corriendo durante el desarrollo para pruebas
