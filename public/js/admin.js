// admin.js — Gestión del menú por el Personal (CRUD de platos)

const AdminMenu = {
  menuData: [],

  async render() {
    const container = document.getElementById('personalContent');
    container.innerHTML = '<p style="padding:20px;text-align:center">Cargando menú...</p>';

    try {
      const resp = await fetch('/api/menu');
      this.menuData = await resp.json();
      this.pintar(container);
    } catch (err) {
      container.innerHTML = `<div class="empty-state">
        <span class="empty-state-emoji">😔</span>
        <p class="empty-state-text">Error al cargar el menú</p>
      </div>`;
    }
  },

  pintar(container) {
    const todosLosPlatos = [];
    this.menuData.forEach(cat => {
      cat.platos.forEach(p => {
        todosLosPlatos.push({ ...p, categoriaNombre: cat.nombre, categoriaId: cat.id });
      });
    });

    const categoriasMap = {};
    this.menuData.forEach(c => { categoriasMap[c.id] = c.nombre; });

    container.innerHTML = `
      <div class="section-header">
        <h2>🍜 Gestionar Menú (${todosLosPlatos.length} platos)</h2>
        <button class="btn btn-primary btn-sm" id="btnAgregarPlato">＋ Agregar Plato</button>
      </div>
      <div style="overflow-x:auto">
      <table class="admin-menu-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Picante</th>
            <th>Veg</th>
            <th>Disp</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${todosLosPlatos.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>${p.imagen ? '📸' : '🍜'}</td>
              <td>
                <strong>${p.nombre}</strong>
                ${p.nombreZh ? `<br><span style="font-size:12px;color:var(--texto-claro)">${p.nombreZh}</span>` : ''}
              </td>
              <td>${p.categoriaNombre}</td>
              <td>${App.formatearPrecio(p.precio)}</td>
              <td>${p.picante ? '🔥' : '—'}</td>
              <td>${p.vegetariano ? '🥬' : '—'}</td>
              <td>${p.disponible ? '✅' : '❌'}</td>
              <td>
                <div class="status-actions">
                  <button class="btn btn-secondary btn-sm" data-editar="${p.id}">✏️</button>
                  <button class="btn btn-danger btn-sm" data-eliminar="${p.id}">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
    `;

    // Vincular botones
    document.getElementById('btnAgregarPlato').addEventListener('click', () => this.abrirFormulario());
    container.querySelectorAll('[data-editar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.editar);
        const plato = todosLosPlatos.find(p => p.id === id);
        if (plato) this.abrirFormulario(plato);
      });
    });
    container.querySelectorAll('[data-eliminar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.eliminar);
        const plato = todosLosPlatos.find(p => p.id === id);
        if (plato && confirm(`¿Eliminar "${plato.nombre}"? Esta acción no se puede deshacer.`)) {
          this.eliminarPlato(id);
        }
      });
    });
  },

  // Abrir formulario (crear o editar)
  abrirFormulario(plato = null) {
    const editando = !!plato;
    const catOptions = this.menuData.map(c =>
      `<option value="${c.id}" ${plato && plato.categoriaId === c.id ? 'selected' : ''}>${c.emoji} ${c.nombre}</option>`
    ).join('');

    const html = `
      <div class="checkout-form">
        <div class="form-group">
          <label>Nombre del plato *</label>
          <input type="text" id="formNombre" value="${plato ? plato.nombre : ''}" placeholder="Ej: Arroz Tres Delicias">
        </div>
        <div class="form-group">
          <label>Nombre en chino</label>
          <input type="text" id="formNombreZh" value="${plato ? plato.nombreZh || '' : ''}" placeholder="Ej: 三鲜炒饭">
        </div>
        <div class="form-group">
          <label>Categoría *</label>
          <select id="formCategoria">${catOptions}</select>
        </div>
        <div class="form-group">
          <label>Precio (CLP) *</label>
          <input type="number" id="formPrecio" value="${plato ? plato.precio : ''}" placeholder="Ej: 6490" min="0" step="10">
        </div>
        <div class="form-group">
          <label>Descripción</label>
          <textarea id="formDescripcion" rows="3" placeholder="Describe el plato...">${plato ? plato.descripcion : ''}</textarea>
        </div>
        <div class="form-group">
          <label>Archivo de imagen</label>
          <input type="text" id="formImagen" value="${plato ? plato.imagen : ''}" placeholder="imagenes/mi-plato.jpg">
        </div>
        <div class="form-group" style="display:flex;gap:16px;align-items:center">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="formPicante" ${plato && plato.picante ? 'checked' : ''}> 🔥 Picante
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="formVegetariano" ${plato && plato.vegetariano ? 'checked' : ''}> 🥬 Vegetariano
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="formDisponible" ${plato ? (plato.disponible ? 'checked' : '') : 'checked'}> ✅ Disponible
          </label>
        </div>
        <button class="btn btn-primary btn-block" id="btnGuardarPlato">
          ${editando ? '💾 Guardar Cambios' : '➕ Agregar Plato'}
        </button>
      </div>
    `;

    App.abrirModal(editando ? 'Editar Plato' : 'Agregar Nuevo Plato', html);

    document.getElementById('btnGuardarPlato').onclick = async () => {
      const datos = {
        nombre: document.getElementById('formNombre').value.trim(),
        nombre_zh: document.getElementById('formNombreZh').value.trim(),
        categoria_id: parseInt(document.getElementById('formCategoria').value),
        precio: parseInt(document.getElementById('formPrecio').value),
        descripcion: document.getElementById('formDescripcion').value.trim(),
        imagen: document.getElementById('formImagen').value.trim(),
        picante: document.getElementById('formPicante').checked,
        vegetariano: document.getElementById('formVegetariano').checked,
        disponible: document.getElementById('formDisponible').checked,
      };

      if (!datos.nombre || !datos.precio || !datos.categoria_id) {
        alert('Nombre, categoría y precio son obligatorios');
        return;
      }

      try {
        const url = editando ? `/api/menu/${plato.id}` : '/api/menu';
        const method = editando ? 'PUT' : 'POST';

        const resp = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        });

        if (resp.ok) {
          App.cerrarModal();
          this.render();
        } else {
          const err = await resp.json();
          alert('Error: ' + (err.error || 'No se pudo guardar'));
        }
      } catch (err) {
        alert('Error de conexión al guardar el plato');
      }
    };
  },

  // Eliminar plato
  async eliminarPlato(id) {
    try {
      const resp = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        this.render();
      } else {
        const err = await resp.json();
        alert('Error: ' + (err.error || 'No se pudo eliminar'));
      }
    } catch (err) {
      alert('Error de conexión al eliminar el plato');
    }
  }
};
