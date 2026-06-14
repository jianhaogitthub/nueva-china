# Requisitos del Sistema — Nueva China

## Requisitos Funcionales

### Modo Cliente
- **RF01**: El cliente puede ver el menú organizado por categorías
- **RF02**: El cliente puede hacer clic en un plato para ver su descripción, precio e imagen
- **RF03**: El cliente puede agregar platos a un carrito de compras
- **RF04**: El cliente puede ajustar cantidades y eliminar items del carrito
- **RF05**: El cliente puede hacer un pedido indicando su nombre y mesa (comer en local) o dirección (delivery)
- **RF06**: El cliente ve una confirmación cuando su pedido es registrado

### Modo Personal (Staff)
- **RF07**: El personal puede ver todos los pedidos ordenados por más reciente
- **RF08**: El personal puede cambiar el estado de un pedido (pendiente → confirmado → preparando → listo)
- **RF09**: El personal puede ver el detalle completo de cada pedido
- **RF10**: El personal puede agregar un nuevo plato al menú (nombre, categoría, precio, descripción, imagen)
- **RF11**: El personal puede editar los datos de un plato existente
- **RF12**: El personal puede eliminar un plato del menú (con confirmación)

### Modo Reparto (Delivery)
- **RF13**: El repartidor puede ver solo los pedidos con modalidad delivery
- **RF14**: El repartidor puede cambiar el estado de entrega (listo → en camino → entregado)
- **RF15**: El repartidor puede ver el historial de entregas del día

### Generales
- **RF16**: El sistema permite cambiar entre los tres modos desde cualquier pantalla
- **RF17**: Todos los textos de la interfaz están en español
- **RF18**: Todos los precios se muestran en pesos chilenos (CLP)

## Requisitos No Funcionales

- **RNF01**: La aplicación debe ser accesible desde cualquier navegador moderno (Chrome, Safari, Firefox)
- **RNF02**: La interfaz debe ser responsive (funcionar en teléfono, tablet y desktop)
- **RNF03**: El sitio debe cargar en menos de 3 segundos
- **RNF04**: Los datos deben persistir entre reinicios del servidor
- **RNF05**: El diseño debe reflejar la identidad visual de un restaurante chino (rojo, dorado)
- **RNF06**: La aplicación debe ser simple de desplegar en Render.com
