# Guía de Despliegue — Nueva China

Esta guía explica cómo publicar el sitio en internet usando Render.com (gratuito).

---

## Requisitos Previos

1. Una cuenta gratuita en [GitHub](https://github.com) — registrarse con email
2. Una cuenta gratuita en [Render.com](https://render.com) — se puede iniciar sesión con la cuenta de GitHub
3. Tener el proyecto funcionando localmente (probado con `node server.js`)

---

## Paso 1: Crear repositorio en GitHub

1. Ir a [github.com/new](https://github.com/new)
2. Nombre del repositorio: `nueva-china`
3. Descripción: "Sitio web del restaurante Nueva China"
4. Visibilidad: **Público** (necesario para el plan gratuito de Render)
5. **NO** marcar "Add a README file"
6. Clic en "Create repository"

---

## Paso 2: Subir el código

Abrir Terminal en la MacBook Air y ejecutar:

```bash
cd "/Users/jianhaopanchen/DeepSeek/Nueva China"

# Inicializar git
git init
git add .
git commit -m "Versión inicial de Nueva China"

# Conectar con GitHub (reemplazar TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/nueva-china.git
git branch -M main
git push -u origin main
```

> Te pedirá usuario y contraseña de GitHub.

---

## Paso 3: Desplegar en Render.com

1. Ir a [dashboard.render.com](https://dashboard.render.com)
2. Clic en **"New +"** → **"Web Service"**
3. Conectar cuenta de GitHub si no está conectada
4. Seleccionar el repositorio `nueva-china`
5. Configurar:
   - **Name**: `nueva-china` (o como quieras)
   - **Runtime**: Node
   - **Build Command**: `npm install && node seed.js`
   - **Start Command**: `node server.js`
   - **Free Plan**: Seleccionar "Free"
6. Clic en **"Create Web Service"**

Render automáticamente:
- Instala las dependencias
- Ejecuta el seed para poblar la base de datos
- Inicia el servidor
- Asigna una URL pública (ej: `https://nueva-china.onrender.com`)

---

## Paso 4: Probar

1. Abrir la URL de Render en el navegador
2. Probar los 3 modos (Cliente, Personal, Reparto)
3. Probar desde un teléfono/tablet
4. ¡Compartir la URL con el equipo!

---

## Notas Importantes

### Plan gratuito de Render
- El servicio se **duerme** después de 15 minutos sin tráfico
- Al recibir una visita, **despierta en ~30-50 segundos**
- Para mantenerlo siempre activo, upgrade a plan pago ($7/mes)

### Actualizar el sitio
Cada vez que hagas cambios en el código:

```bash
cd "/Users/jianhaopanchen/DeepSeek/Nueva China"
git add .
git commit -m "Descripción del cambio"
git push
```

Render detecta el push y redespliega automáticamente.

### Dominio personalizado (opcional)
Render permite configurar un dominio propio (ej: `www.nuevachina.cl`) en el plan Starter ($7/mes).

---

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| El sitio no carga | Esperar 30-60 segundos (el servicio gratuito se duerme) |
| Error 500 | Revisar logs en dashboard.render.com |
| No se ven imágenes | Las imágenes deben estar en `public/imagenes/` |
| Base de datos vacía | Ejecutar `node seed.js` en local, commit y push |
