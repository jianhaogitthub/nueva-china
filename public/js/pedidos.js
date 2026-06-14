// pedidos.js — Gestión de pedidos (Personal y Reparto)

const ModuloPedidos = {
  // Cargar lista de pedidos según el modo
  async cargar(modo) {
    const container = document.getElementById(modo === 'personal' ? 'personalContent' : 'deliveryContent');
    if (!container) return;

    container.innerHTML = '<p style="padding:20px;text-align:center;color:var(--texto-claro)">Cargando pedidos...</p>';

    try {
      let url = '/api/pedidos';
      if (modo === 'reparto') {
        url += '?es_delivery=1';
      }

      const resp = await fetch(url, { headers: App.authHeadersNoContent() });
      const pedidos = await resp.json();

      if (pedidos.length === 0) {
        const emoji = modo === 'reparto' ? '🛵' : '📋';
        const msg = modo === 'reparto' ? 'No hay entregas pendientes' : 'No hay pedidos todavía';
        container.innerHTML = `<div class="empty-state">
          <span class="empty-state-emoji">${emoji}</span>
          <p class="empty-state-text">${msg}</p>
        </div>`;
        return;
      }

      if (modo === 'personal') {
        this.renderTablaPedidos(container, pedidos);
      } else {
        this.renderTarjetasReparto(container, pedidos);
      }
    } catch (err) {
      container.innerHTML = `<div class="empty-state">
        <span class="empty-state-emoji">😔</span>
        <p class="empty-state-text">Error al cargar pedidos</p>
      </div>`;
    }
  },

  // Vista tabla para Personal
  renderTablaPedidos(container, pedidos) {
    const estadosFlujo = ['pendiente', 'confirmado', 'preparando', 'listo', 'servido', 'en-camino', 'entregado'];

    let html = `
      <div class="section-header">
        <h2>📋 Pedidos (${pedidos.length})</h2>
        <button class="btn btn-secondary btn-sm" onclick="ModuloPedidos.actualizar()">🔄 Actualizar</button>
      </div>
      <div style="overflow-x:auto">
      <table class="order-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Tipo</th>
            <th>Items</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
    `;

    pedidos.forEach(p => {
      const esDelivery = p.es_delivery === 1;
      const tipo = esDelivery ? `🛵 ${p.direccion_entrega || 'Delivery'}` : `🏠 ${p.mesa || 'Mesa'}`;
      const itemsResumen = p.items.map(i => `${i.cantidad}x ${i.nombre_plato}`).join(', ');
      const siguiente = this.obtenerSiguienteEstado(p.estado);

      html += `
        <tr class="order-expand" data-id="${p.id}">
          <td><strong>${p.id}</strong></td>
          <td>${p.nombre_cliente}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${tipo}">${tipo}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${itemsResumen}">${itemsResumen}</td>
          <td><strong>${App.formatearPrecio(p.total)}</strong></td>
          <td><span class="badge badge-status badge-${p.estado}">${p.estado}</span></td>
          <td>
            <div class="status-actions">
              ${siguiente ? `<button class="btn btn-primary btn-sm" data-avanzar="${p.id}" data-estado="${siguiente}">▶ ${siguiente}</button>` : '<span style="font-size:12px;color:var(--texto-claro)">—</span>'}
            </div>
          </td>
        </tr>
        <tr class="order-detail hidden" id="detalle-${p.id}">
          <td colspan="7">
            <strong>Cliente:</strong> ${p.nombre_cliente} |
            <strong>${esDelivery ? 'Dirección' : 'Mesa'}:</strong> ${esDelivery ? p.direccion_entrega : p.mesa} |
            <strong>Creado:</strong> ${new Date(p.creado_en).toLocaleTimeString('es-CL')}
            <ul class="order-detail-items">
              ${p.items.map(i => `
                <li><span>${i.cantidad}x ${i.nombre_plato}</span> <span>${App.formatearPrecio(i.precio_unitario * i.cantidad)}</span></li>
              `).join('')}
            </ul>
            <div style="text-align:right;margin-top:8px;font-weight:700">
              Total: ${App.formatearPrecio(p.total)}
            </div>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';

    // Agregar toggle para detalles expandidos
    html += `
      <script>
        document.querySelectorAll('.order-expand').forEach(row => {
          row.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            const id = this.dataset.id;
            const detalle = document.getElementById('detalle-' + id);
            if (detalle) detalle.classList.toggle('hidden');
          });
        });
      </script>
    `;

    container.innerHTML = html;

    // Vincular botones de avanzar estado
    setTimeout(() => {
      container.querySelectorAll('[data-avanzar]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = btn.dataset.avanzar;
          const estado = btn.dataset.estado;
          await this.cambiarEstado(id, estado, 'personal');
        });
      });
    }, 50);
  },

  // Vista tarjetas para Reparto
  renderTarjetasReparto(container, pedidos) {
    const pendientes = pedidos.filter(p => p.estado !== 'entregado');

    if (pendientes.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <span class="empty-state-emoji">🎉</span>
        <p class="empty-state-text">Todas las entregas están completas</p>
      </div>`;
      return;
    }

    container.innerHTML = `
      <div class="delivery-grid">
        ${pendientes.map(p => {
          const siguiente = this.obtenerSiguienteEstado(p.estado);
          return `
            <div class="delivery-card ${p.estado}">
              <div class="delivery-card-header">
                <span class="delivery-card-id">${p.id}</span>
                <span class="badge badge-status badge-${p.estado}">${p.estado}</span>
              </div>
              <div class="delivery-card-address">
                📍 ${p.direccion_entrega || 'Sin dirección'}
              </div>
              <div class="delivery-card-items">
                <strong>${p.nombre_cliente}</strong> — ${p.items.map(i => `${i.cantidad}x ${i.nombre_plato}`).join(', ')}
              </div>
              <div style="font-weight:700;color:var(--rojo);margin-bottom:14px">
                Total: ${App.formatearPrecio(p.total)}
              </div>
              <div class="delivery-card-actions">
                ${siguiente ? `<button class="btn btn-primary btn-sm" onclick="ModuloPedidos.cambiarEstado('${p.id}','${siguiente}','reparto')">▶ ${siguiente.replace(/-/g, ' ')}</button>` : '<span style="font-size:12px;color:var(--verde)">✅ Completado</span>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Cargar historial de reparto
  async cargarHistorialReparto() {
    const container = document.getElementById('deliveryContent');
    try {
      const resp = await fetch('/api/pedidos?es_delivery=1');
      const pedidos = await resp.json();
      const entregados = pedidos.filter(p => p.estado === 'entregado');

      container.innerHTML = `
        <h3 style="margin-bottom:16px">📋 Historial de Entregas</h3>
        <button class="btn btn-secondary btn-sm mb-4" onclick="ModoReparto.render()">⬅ Volver a pendientes</button>
        ${entregados.length === 0 ? `<div class="empty-state">
          <span class="empty-state-emoji">📭</span>
          <p class="empty-state-text">No hay entregas completadas hoy</p>
        </div>` : `
          <div class="delivery-grid">
            ${entregados.map(p => `
              <div class="delivery-card entregado" style="opacity:0.7">
                <div class="delivery-card-header">
                  <span class="delivery-card-id">${p.id}</span>
                  <span class="badge badge-status badge-entregado">✅ Entregado</span>
                </div>
                <div style="font-size:13px;color:var(--texto-secundario)">📍 ${p.direccion_entrega}</div>
                <div style="font-size:13px">${p.nombre_cliente} — ${App.formatearPrecio(p.total)}</div>
                <div style="font-size:12px;color:var(--texto-claro)">${new Date(p.creado_en).toLocaleString('es-CL')}</div>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } catch (err) {
      container.innerHTML = '<p style="color:var(--rojo)">Error al cargar historial</p>';
    }
  },

  // Cambiar estado de un pedido
  async cambiarEstado(id, nuevoEstado, modo) {
    try {
      const resp = await fetch(`/api/pedidos/${id}`, {
        method: 'PUT',
        headers: App.authHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (resp.ok) {
        // Recargar vista
        if (modo === 'personal') {
          ModoPersonal.render();
        } else {
          ModoReparto.render();
        }
      } else {
        const data = await resp.json();
        alert('Error: ' + (data.error || 'No se pudo actualizar'));
      }
    } catch (err) {
      alert('Error de conexión al actualizar el pedido');
    }
  },

  // Actualizar vista actual
  actualizar() {
    if (App.modoActual === 'personal') {
      ModoPersonal.render();
    } else if (App.modoActual === 'reparto') {
      ModoReparto.render();
    }
  },

  // Determinar el siguiente estado válido
  obtenerSiguienteEstado(estado) {
    const flujo = {
      'pendiente': 'confirmado',
      'confirmado': 'preparando',
      'preparando': 'listo',
      'listo': null, // el personal decide "servido" o el reparto "en-camino"
    };
    return flujo[estado] || null;
  }
};
