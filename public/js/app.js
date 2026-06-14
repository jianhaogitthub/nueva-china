// app.js — Inicialización de la app, cambio de modos, autenticación

const App = {
  modoActual: null,
  token: null,
  usuario: null, // { username, rol }

  init() {
    this.token = sessionStorage.getItem('token');
    this.usuario = JSON.parse(sessionStorage.getItem('usuario') || 'null');
    this.bindModoButtons();
    this.bindCartToggle();
    this.actualizarTopbar();
    if (this.token) this.verificarSesion().finally(() => this.irALanding());
    else this.irALanding();
  },

  // ---- AUTENTICACIÓN ----

  async verificarSesion() {
    try {
      const resp = await fetch('/api/session', { headers: this.authHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        this.usuario = data;
        sessionStorage.setItem('usuario', JSON.stringify(data));
        this.actualizarTopbar();
      } else {
        this.cerrarSesion();
      }
    } catch { /* offline — mantener sesión local */ }
  },

  async login(username, password) {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Error al iniciar sesión');
    this.token = data.token;
    this.usuario = { username: data.username, rol: data.rol };
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('usuario', JSON.stringify(this.usuario));
    this.actualizarTopbar();
    return data;
  },

  cerrarSesion() {
    if (this.token) fetch('/api/logout', { method: 'POST', headers: this.authHeaders() }).catch(() => {});
    this.token = null;
    this.usuario = null;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    this.actualizarTopbar();
    this.irALanding();
  },

  authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    return headers;
  },

  authHeadersNoContent() {
    const headers = {};
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    return headers;
  },

  mostrarLogin(modoDestino) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <span style="font-size:48px">🔐</span>
            <h2>Iniciar Sesión</h2>
            <p>Ingresa para acceder al modo ${modoDestino === 'personal' ? 'Personal' : 'Reparto'}</p>
          </div>
          <form id="loginForm" class="login-form">
            <div class="form-group">
              <label>Usuario</label>
              <input type="text" id="loginUsername" placeholder="Usuario" required autofocus>
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" id="loginPassword" placeholder="Contraseña" required>
            </div>
            <p class="login-error hidden" id="loginError"></p>
            <button type="submit" class="btn btn-primary btn-block">Iniciar Sesión</button>
          </form>
          <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--texto-terciario)">
            <a onclick="App.irALanding()" style="cursor:pointer;color:var(--rojo)">← Volver al inicio</a>
          </p>
        </div>
      </div>
    `;
    main.querySelector('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const btn = main.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Iniciando...';
      try {
        await this.login(username, password);
        this.cambiarModo(modoDestino);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
        btn.disabled = false; btn.textContent = 'Iniciar Sesión';
      }
    });
  },

  // ---- NAVEGACIÓN ----

  bindModoButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cambiarModo(btn.dataset.mode);
      });
    });
  },

  cambiarModo(modo) {
    // Verificar auth para modos protegidos
    if ((modo === 'personal' || modo === 'reparto') && !this.token) {
      this.mostrarLogin(modo);
      return;
    }
    this.modoActual = modo;
    this.actualizarTopbar();
    const main = document.getElementById('mainContent');
    main.innerHTML = '';
    switch (modo) {
      case 'cliente': MenuCliente.render(); break;
      case 'personal': ModoPersonal.render(); break;
      case 'reparto': ModoReparto.render(); break;
    }
  },

  actualizarTopbar() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.modoActual);
    });
    // Mostrar/ocultar botón logout
    let logoutBtn = document.getElementById('logoutBtn');
    if (this.usuario) {
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'logout-btn';
        logoutBtn.title = `Sesión: ${this.usuario.username} — Cerrar sesión`;
        logoutBtn.innerHTML = `👤 ${this.usuario.username} ✕`;
        logoutBtn.addEventListener('click', () => this.cerrarSesion());
        document.querySelector('.topbar-right').prepend(logoutBtn);
      }
    } else {
      if (logoutBtn) logoutBtn.remove();
    }
  },

  // Actualizar botones activos en la barra superior
  actualizarTopbar() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.modoActual);
    });
  },

  // Mostrar landing page (selector de modo)
  irALanding() {
    this.modoActual = null;
    this.actualizarTopbar();
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="landing">
        <div class="landing-hero">
          <span class="landing-logo">🥢</span>
          <h1 class="landing-title">Nueva China</h1>
          <p class="landing-subtitle">Auténtica cocina china en el corazón de Chile</p>
        </div>
        <div class="mode-selector">
          <div class="mode-card" data-goto="cliente">
            <span class="mode-card-emoji">🍽️</span>
            <h3 class="mode-card-title">Cliente</h3>
            <p class="mode-card-desc">Explora el menú y haz tu pedido</p>
          </div>
          <div class="mode-card" data-goto="personal">
            <span class="mode-card-emoji">👨‍🍳</span>
            <h3 class="mode-card-title">Personal</h3>
            <p class="mode-card-desc">Gestiona pedidos y el menú</p>
          </div>
          <div class="mode-card" data-goto="reparto">
            <span class="mode-card-emoji">🛵</span>
            <h3 class="mode-card-title">Reparto</h3>
            <p class="mode-card-desc">Seguimiento de entregas</p>
          </div>
        </div>
      </div>
    `;

    // Vincular clic en las tarjetas del selector
    main.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        this.cambiarModo(card.dataset.goto);
      });
    });
  },

  ocultarLanding() {
    // El contenido se reemplaza por el modo correspondiente
  },

  // ---- CARRITO ----

  bindCartToggle() {
    const cartBtn = document.getElementById('cartBtn');
    const cartPanel = document.getElementById('cartPanel');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');

    cartBtn.addEventListener('click', () => Carrito.abrir());
    cartClose.addEventListener('click', () => Carrito.cerrar());
    cartOverlay.addEventListener('click', () => Carrito.cerrar());
  },

  // ---- MODAL ----

  abrirModal(titulo, contenidoHTML) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = contenidoHTML;
    document.getElementById('modalOverlay').classList.add('visible');
    document.getElementById('modal').classList.add('visible');

    document.getElementById('modalClose').onclick = () => this.cerrarModal();
    document.getElementById('modalOverlay').onclick = () => this.cerrarModal();
  },

  cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
    document.getElementById('modal').classList.remove('visible');
  },

  // ---- UTILIDADES ----

  // Formatear precio en CLP ($X.XXX)
  formatearPrecio(precio) {
    return '$' + precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  // Generar ID de pedido único
  generarIdPedido() {
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 900 + 100);
    return `ped-${hoy}-${rand}`;
  }
};

// ============ MODO CLIENTE ============
const MenuCliente = {
  menuData: [],
  categoriaActual: null,

  async render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `<p class="text-center" style="padding:40px">Cargando menú...</p>`;

    try {
      const resp = await fetch('/api/menu');
      this.menuData = await resp.json();
      this.categoriaActual = null;
      this.pintar();
    } catch (err) {
      main.innerHTML = `<div class="empty-state">
        <span class="empty-state-emoji">😔</span>
        <p class="empty-state-text">Error al cargar el menú</p>
      </div>`;
    }
  },

  pintar() {
    const main = document.getElementById('mainContent');
    const todasCat = this.menuData;
    const catActual = this.categoriaActual;

    let categoriasAMostrar = todasCat;
    if (catActual) {
      categoriasAMostrar = todasCat.filter(c => c.slug === catActual);
    }

    // Favorites: pick 3 top dishes
    const todosLosPlatos = [];
    todasCat.forEach(c => c.platos.forEach(p => todosLosPlatos.push({...p, catSlug: c.slug})));
    const favoritos = todosLosPlatos.filter(p => ['especialidades','entradas'].includes(p.catSlug)).slice(0, 3);

    // Tabs
    const tabsHTML = `
      <div class="cat-tabs">
        <button class="cat-tab ${!catActual ? 'active' : ''}" data-cat="">Todo</button>
        ${todasCat.map(c => `
          <button class="cat-tab ${catActual === c.slug ? 'active' : ''}" data-cat="${c.slug}">
            ${c.emoji} ${c.nombre}
          </button>
        `).join('')}
      </div>
    `;

    // Favorites section
    const favHTML = !catActual && favoritos.length > 0 ? `
      <div class="category-header">
        <span class="category-header-name">⭐ Favoritos</span>
        <span class="category-header-count">Los más pedidos</span>
      </div>
      <div class="dish-grid">${favoritos.map(p => this.tarjetaPlato(p)).join('')}</div>
    ` : '';

    // Category sections with banner headers
    const seccionesHTML = categoriasAMostrar.map(cat => `
      <div class="category-header">
        <span class="category-header-emoji">${cat.emoji}</span>
        <span class="category-header-name">${cat.nombre}</span>
        <span class="category-header-count">${cat.platos.length} platos</span>
      </div>
      <div class="dish-grid">
          ${cat.platos.map(p => this.tarjetaPlato(p)).join('')}
        </div>
      </div>
    `).join('');

    main.innerHTML = tabsHTML + favHTML + seccionesHTML;

    // Vincular tabs
    main.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.categoriaActual = tab.dataset.cat || null;
        this.pintar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Vincular clic en tarjetas de plato
    main.querySelectorAll('.dish-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        this.abrirDetalle(id);
      });
    });
  },

  tarjetaPlato(p) {
    return `
      <div class="dish-card" data-id="${p.id}">
        <div class="dish-card-img">
          ${p.imagen
            ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy">`
            : `<span style="font-size:64px">🍜</span>`
          }
        </div>
        <div class="dish-card-body">
          <div class="dish-card-name">${p.nombre}</div>
          ${p.nombreZh ? `<div class="dish-card-name-zh">${p.nombreZh}</div>` : ''}
          <div class="dish-card-footer">
            <span class="dish-card-price">${App.formatearPrecio(p.precio)}</span>
            <span class="dish-card-badges">
              ${p.picante ? '<span class="badge badge-spicy">🔥</span>' : ''}
              ${p.vegetariano ? '<span class="badge badge-veg">🥬</span>' : ''}
            </span>
          </div>
        </div>
      </div>
    `;
  },

  abrirDetalle(id) {
    // Buscar plato en todas las categorías
    let plato = null;
    for (const cat of this.menuData) {
      const found = cat.platos.find(p => p.id === id);
      if (found) { plato = found; break; }
    }
    if (!plato) return;

    let cantidad = 1;

    const renderDetalle = () => {
      const html = `
        <div class="dish-detail-img">
          ${plato.imagen ? `<img src="${plato.imagen}" alt="${plato.nombre}" style="width:100%;height:100%;object-fit:cover">` : '🍜'}
        </div>
        <div class="dish-detail-name">${plato.nombre}</div>
        ${plato.nombreZh ? `<div class="dish-detail-name-zh">${plato.nombreZh}</div>` : ''}
        <div class="dish-detail-meta">
          ${plato.picante ? '<span class="badge badge-spicy">🔥 Picante</span>' : ''}
          ${plato.vegetariano ? '<span class="badge badge-veg">🥬 Vegetariano</span>' : ''}
        </div>
        <p class="dish-detail-desc">${plato.descripcion}</p>
        <div class="dish-detail-price">${App.formatearPrecio(plato.precio)}</div>
        <div class="quantity-selector">
          <button class="qty-btn" id="qtyMinus">−</button>
          <span class="qty-num" id="qtyNum">${cantidad}</span>
          <button class="qty-btn" id="qtyPlus">+</button>
        </div>
        <button class="btn btn-primary btn-block" id="btnAgregar">
          🛒 Agregar al Carrito — ${App.formatearPrecio(plato.precio * cantidad)}
        </button>
      `;

      App.abrirModal(plato.nombre, html);

      // Eventos de cantidad
      document.getElementById('qtyMinus').onclick = () => {
        if (cantidad > 1) { cantidad--; renderDetalle(); }
      };
      document.getElementById('qtyPlus').onclick = () => {
        cantidad++; renderDetalle();
      };
      document.getElementById('btnAgregar').onclick = () => {
        Carrito.agregar({ ...plato, cantidad });
        App.cerrarModal();
      };
    };

    renderDetalle();
  }
};

// ============ MODO PERSONAL ============
const ModoPersonal = {
  pestana: 'pedidos', // 'pedidos' | 'menu'

  render() {
    const main = document.getElementById('mainContent');

    const html = `
      <div class="tabs">
        <button class="tab-btn ${this.pestana === 'pedidos' ? 'active' : ''}" data-tab="pedidos">📋 Pedidos</button>
        <button class="tab-btn ${this.pestana === 'menu' ? 'active' : ''}" data-tab="menu">🍜 Menú</button>
        <button class="tab-btn ${this.pestana === 'usuarios' ? 'active' : ''}" data-tab="usuarios">👥 Usuarios</button>
      </div>
      <div id="personalContent"></div>
    `;
    main.innerHTML = html;
    main.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { this.pestana = btn.dataset.tab; this.render(); });
    });
    if (this.pestana === 'pedidos') ModuloPedidos.cargar('personal');
    else if (this.pestana === 'usuarios') AdminUsuarios.render();
    else AdminMenu.render();
  }
};

// ============ MODO REPARTO ============
const ModoReparto = {
  render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="section-header">
        <h2>🛵 Entregas Pendientes</h2>
        <button class="btn btn-secondary btn-sm" id="btnHistorialReparto">📋 Ver Historial</button>
      </div>
      <div id="deliveryContent"></div>
    `;

    document.getElementById('btnHistorialReparto').addEventListener('click', () => {
      ModuloPedidos.cargarHistorialReparto();
    });

    ModuloPedidos.cargar('reparto');
  }
};

// ============ INICIAR ============
document.addEventListener('DOMContentLoaded', () => App.init());
