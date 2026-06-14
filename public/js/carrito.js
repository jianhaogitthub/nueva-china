// carrito.js — Lógica del carrito de compras y checkout

const Carrito = {
  items: [],

  // Agregar un plato al carrito
  agregar(plato) {
    const existente = this.items.find(i => i.id === plato.id);
    if (existente) {
      existente.cantidad += plato.cantidad || 1;
    } else {
      this.items.push({
        id: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad: plato.cantidad || 1,
      });
    }
    this.actualizarUI();
  },

  // Quitar un plato del carrito
  quitar(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.actualizarUI();
  },

  // Cambiar cantidad de un item
  cambiarCantidad(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      this.quitar(id);
    } else {
      this.actualizarUI();
    }
  },

  // Vaciar carrito
  vaciar() {
    this.items = [];
    this.actualizarUI();
  },

  // Calcular total en CLP
  total() {
    return this.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  },

  // Cantidad total de items
  cantidadTotal() {
    return this.items.reduce((sum, i) => sum + i.cantidad, 0);
  },

  // Abrir panel del carrito
  abrir() {
    document.getElementById('cartOverlay').classList.add('visible');
    document.getElementById('cartPanel').classList.add('visible');
    this.actualizarUI();
  },

  // Cerrar panel del carrito
  cerrar() {
    document.getElementById('cartOverlay').classList.remove('visible');
    document.getElementById('cartPanel').classList.remove('visible');
  },

  // Actualizar UI del carrito (panel + botón)
  actualizarUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const total = this.total();
    const cantTotal = this.cantidadTotal();

    // Badge del botón
    cartCount.textContent = cantTotal;
    cartCount.style.display = cantTotal > 0 ? 'flex' : 'none';

    // Lista de items
    if (this.items.length === 0) {
      cartItems.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
      cartFooter.style.display = 'none';
    } else {
      cartItems.innerHTML = this.items.map(i => `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${i.nombre}</div>
            <div class="cart-item-price">${App.formatearPrecio(i.precio)} c/u</div>
          </div>
          <div class="cart-item-qty">
            <button data-action="minus" data-id="${i.id}">−</button>
            <span>${i.cantidad}</span>
            <button data-action="plus" data-id="${i.id}">+</button>
          </div>
          <button class="cart-item-remove" data-action="remove" data-id="${i.id}">🗑️</button>
        </div>
      `).join('');

      // Vincular botones de cantidad y eliminar
      cartItems.querySelectorAll('[data-action="minus"]').forEach(btn => {
        btn.addEventListener('click', () => this.cambiarCantidad(parseInt(btn.dataset.id), -1));
      });
      cartItems.querySelectorAll('[data-action="plus"]').forEach(btn => {
        btn.addEventListener('click', () => this.cambiarCantidad(parseInt(btn.dataset.id), 1));
      });
      cartItems.querySelectorAll('[data-action="remove"]').forEach(btn => {
        btn.addEventListener('click', () => this.quitar(parseInt(btn.dataset.id)));
      });

      cartFooter.style.display = 'block';
      cartTotal.textContent = App.formatearPrecio(total);

      // Vincular botón checkout
      document.getElementById('checkoutBtn').onclick = () => this.mostrarCheckout();
    }
  },

  // Mostrar formulario de checkout
  mostrarCheckout() {
    const html = `
      <div class="checkout-form">
        <div class="form-group">
          <label>Tu nombre</label>
          <input type="text" id="checkNombre" placeholder="Ej: María" required>
        </div>
        <div class="form-group">
          <label>Tipo de pedido</label>
          <div class="toggle-group" id="toggleTipo">
            <button class="toggle-option active" data-tipo="local">🏠 Comer en local</button>
            <button class="toggle-option" data-tipo="delivery">🛵 Delivery</button>
          </div>
        </div>
        <div class="form-group" id="grupoMesa">
          <label>Nº de mesa</label>
          <input type="text" id="checkMesa" placeholder="Ej: B5">
        </div>
        <div class="form-group hidden" id="grupoDireccion">
          <label>Dirección de entrega</label>
          <input type="text" id="checkDireccion" placeholder="Ej: Av. Providencia 123, Santiago">
        </div>
        <div style="background:var(--crema); padding:16px; border-radius:var(--radio-sm); margin-top:8px">
          <strong>Total a pagar:</strong>
          <span style="font-size:22px;font-weight:700;color:var(--rojo);float:right">
            ${App.formatearPrecio(this.total())}
          </span>
          <div style="clear:both"></div>
          <p style="font-size:12px;color:var(--texto-claro);margin-top:4px">Pago en efectivo o transferencia al recibir</p>
        </div>
        <button class="btn btn-primary btn-block" id="btnConfirmarPedido" style="margin-top:8px">
          ✅ Confirmar Pedido
        </button>
      </div>
    `;

    App.abrirModal('Confirmar Pedido', html);

    // Toggle tipo de pedido
    let esDelivery = false;
    document.getElementById('toggleTipo').querySelectorAll('.toggle-option').forEach(btn => {
      btn.addEventListener('click', () => {
        esDelivery = btn.dataset.tipo === 'delivery';
        document.querySelectorAll('#toggleTipo .toggle-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('grupoMesa').classList.toggle('hidden', esDelivery);
        document.getElementById('grupoDireccion').classList.toggle('hidden', !esDelivery);
      });
    });

    // Confirmar pedido
    document.getElementById('btnConfirmarPedido').onclick = async () => {
      const nombre = document.getElementById('checkNombre').value.trim();
      const mesa = esDelivery ? '' : (document.getElementById('checkMesa').value.trim() || 'Sin mesa');
      const direccion = esDelivery ? document.getElementById('checkDireccion').value.trim() : '';

      if (!nombre) {
        alert('Por favor ingresa tu nombre');
        return;
      }
      if (esDelivery && !direccion) {
        alert('Por favor ingresa la dirección de entrega');
        return;
      }

      const pedido = {
        nombre_cliente: nombre,
        mesa: mesa,
        es_delivery: esDelivery,
        direccion_entrega: direccion,
        items: this.items.map(i => ({
          plato_id: i.id,
          cantidad: i.cantidad,
        })),
      };

      try {
        const resp = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedido),
        });
        const data = await resp.json();

        if (resp.ok) {
          App.cerrarModal();
          this.cerrar();
          this.vaciar();

          // Mostrar confirmación
          const confirmHTML = `
            <div class="text-center" style="padding:20px">
              <span style="font-size:64px;display:block;margin-bottom:12px">✅</span>
              <h3 style="margin-bottom:8px">¡Pedido Confirmado!</h3>
              <p style="color:var(--texto-secundario);margin-bottom:4px">Tu número de pedido es:</p>
              <p style="font-size:24px;font-weight:700;color:var(--rojo)">${data.id}</p>
              <p style="font-size:13px;color:var(--texto-claro);margin-top:8px">
                ${esDelivery ? 'Tu pedido será entregado pronto' : 'Te avisaremos cuando esté listo'}
              </p>
            </div>
          `;
          App.abrirModal('Pedido Exitoso', confirmHTML);
          document.getElementById('modalClose').onclick = () => {
            App.cerrarModal();
            App.irALanding();
          };
        } else {
          alert('Error al crear el pedido: ' + (data.error || 'Intenta de nuevo'));
        }
      } catch (err) {
        alert('Error de conexión. Revisa que el servidor esté funcionando.');
      }
    };
  }
};
