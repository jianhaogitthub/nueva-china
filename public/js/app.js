// app.js — Inicialización de la app, cambio de modos y navegación

const App = {
  modoActual: null,   // 'cliente' | 'personal' | 'reparto' | null (landing)

  // Inicializar la aplicación
  init() {
    this.bindModoButtons();
    this.bindCartToggle();
    this.irALanding();
  },

  // Vincular botones de cambio de modo en la barra superior
  bindModoButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modo = btn.dataset.mode;
        this.cambiarModo(modo);
      });
    });
  },

  // Cambiar entre modos
  cambiarModo(modo) {
    this.modoActual = modo;
    this.actualizarTopbar();
    this.ocultarLanding();

    switch (modo) {
      case 'cliente':
        MenuCliente.render();
        break;
      case 'personal':
        ModoPersonal.render();
        break;
      case 'reparto':
        ModoReparto.render();
        break;
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

    // Determinar qué platos mostrar
    let categoriasAMostrar = todasCat;
    if (catActual) {
      categoriasAMostrar = todasCat.filter(c => c.slug === catActual);
    }

    // Tabs de categorías
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

    // Grid de platos
    const platosHTML = categoriasAMostrar.map(cat => `
      <div class="mb-4">
        <h2 style="font-size:18px; font-weight:700; margin-bottom:12px; color:var(--texto-secundario)">
          ${cat.emoji} ${cat.nombre}
        </h2>
        <div class="dish-grid">
          ${cat.platos.map(p => `
            <div class="dish-card" data-id="${p.id}">
              <div class="dish-card-img">
                ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy" style="width:100%;height:100%;object-fit:cover">` : '🍜'}
              </div>
              <div class="dish-card-body">
                <div class="dish-card-name">${p.nombre}</div>
                ${p.nombreZh ? `<div class="dish-card-name-zh">${p.nombreZh}</div>` : ''}
                <div class="dish-card-footer">
                  <span class="dish-card-price">${App.formatearPrecio(p.precio)}</span>
                  <span class="dish-card-badges">
                    ${p.picante ? '<span class="badge badge-spicy">🔥 Picante</span>' : ''}
                    ${p.vegetariano ? '<span class="badge badge-veg">🥬 Veg</span>' : ''}
                  </span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    main.innerHTML = tabsHTML + platosHTML;

    // Vincular tabs
    main.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.categoriaActual = tab.dataset.cat || null;
        this.pintar();
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
        <button class="tab-btn ${this.pestana === 'pedidos' ? 'active' : ''}" data-tab="pedidos">
          📋 Pedidos
        </button>
        <button class="tab-btn ${this.pestana === 'menu' ? 'active' : ''}" data-tab="menu">
          🍜 Gestionar Menú
        </button>
      </div>
      <div id="personalContent"></div>
    `;

    main.innerHTML = html;

    // Vincular tabs
    main.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.pestana = btn.dataset.tab;
        this.render();
      });
    });

    // Cargar contenido según pestaña
    if (this.pestana === 'pedidos') {
      ModuloPedidos.cargar('personal');
    } else {
      AdminMenu.render();
    }
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
