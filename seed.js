// seed.js — Poblar la base de datos con datos iniciales
// Ejecutar con: node seed.js

const { db, inicializarBD } = require('./db');

inicializarBD();

// Verificar si ya hay datos
const countCategorias = db.prepare('SELECT COUNT(*) as count FROM categorias').get();
if (countCategorias.count > 0) {
  console.log('ℹ️  La base de datos ya tiene datos. Saltando seed.');
  console.log('   Para reiniciar: borra nueva-china.db y ejecuta node seed.js de nuevo.');
  process.exit(0);
}

// ============ CATEGORÍAS ============
const insertarCategoria = db.prepare('INSERT INTO categorias (slug, nombre, emoji) VALUES (?, ?, ?)');

const categorias = [
  ['especialidades', 'Especialidades del Chef', '⭐'],
  ['entradas', 'Entradas', '🥟'],
  ['sopas', 'Sopas', '🍜'],
  ['principales', 'Platos Principales', '🥘'],
  ['arroz-fideos', 'Arroces y Fideos', '🍚'],
  ['postres', 'Postres', '🍡'],
  ['bebidas', 'Bebidas', '🍵'],
];

const insertarCategorias = db.transaction(() => {
  for (const cat of categorias) {
    insertarCategoria.run(...cat);
  }
});
insertarCategorias();
console.log('✅ 7 categorías insertadas');

// ============ PLATOS ============
const insertarPlato = db.prepare(`
  INSERT INTO platos (nombre, nombre_zh, categoria_id, precio, descripcion, imagen, picante, vegetariano, disponible)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const platos = [
  // Especialidades del Chef (categoria_id = 1)
  ['Pollo Kung Pao', '宫保鸡丁', 1, 8990, 'Pollo salteado con maní, pimiento seco, cebollín y salsa de soya picante. Una de las especialidades más pedidas de la casa.', 'imagenes/pollo-kung-pao.jpg', 1, 0, 1],
  ['Pato Pekín', '北京烤鸭', 1, 15990, 'Pato laqueado servido con panqueques finos, cebollín, pepino y salsa hoisin. Para 2 personas.', 'imagenes/pato-pekin.jpg', 0, 0, 1],
  ['Cerdo Agridulce', '糖醋里脊', 1, 7990, 'Lomitos de cerdo crujientes bañados en salsa agridulce casera con piña y pimiento.', 'imagenes/cerdo-agridulce.jpg', 0, 0, 1],

  // Entradas (categoria_id = 2)
  ['Rollitos Primavera', '春卷', 2, 3990, '4 rollitos crocantes rellenos de verduras frescas y fideos de arroz. Acompañados de salsa agridulce.', 'imagenes/rollitos-primavera.jpg', 0, 1, 1],
  ['Wantanes Fritos', '炸馄饨', 2, 4490, '8 wantanes de cerdo y verduras, dorados y crujientes. Servidos con salsa de soya y jengibre.', 'imagenes/wantanes-fritos.jpg', 0, 0, 1],
  ['Panecillos al Vapor', '馒头', 2, 3490, '6 panecillos de masa suave al vapor. Perfectos para acompañar cualquier plato.', 'imagenes/panecillos-vapor.jpg', 0, 1, 1],

  // Sopas (categoria_id = 3)
  ['Sopa Agripicante', '酸辣汤', 3, 4990, 'Sopa tradicional china con tofu, hongos, huevo, brotes de bambú y un equilibrio perfecto entre ácido y picante.', 'imagenes/sopa-agripicante.jpg', 1, 0, 1],
  ['Sopa Wantán', '馄饨汤', 3, 5490, 'Caldo de pollo aromático con 6 wantanes de cerdo, cebollín y verduras frescas.', 'imagenes/sopa-wantan.jpg', 0, 0, 1],
  ['Sopa de Fideos con Pollo', '鸡汤面', 3, 6490, 'Caldo de pollo casero con fideos de trigo, pechuga de pollo, pak choi y huevo cocido.', 'imagenes/sopa-fideos-pollo.jpg', 0, 0, 1],

  // Platos Principales (categoria_id = 4)
  ['Pollo con Almendras', '杏仁鸡', 4, 8490, 'Pollo salteado con almendras tostadas, apio, zanahoria y salsa de ostras. Servido con arroz blanco.', 'imagenes/pollo-almendras.jpg', 0, 0, 1],
  ['Carne Mongoliana', '蒙古牛肉', 4, 9490, 'Láminas de carne de res salteadas con cebolla, cebollín y salsa de soya oscura. Intenso y sabroso.', 'imagenes/carne-mongoliana.jpg', 0, 0, 1],
  ['Pollo con Brócoli', '西兰花鸡', 4, 7990, 'Pollo salteado con brócoli fresco, ajo y salsa de ostras ligera. Un clásico saludable.', 'imagenes/pollo-brocoli.jpg', 0, 0, 1],
  ['Mapo Tofu', '麻婆豆腐', 4, 7490, 'Tofu sedoso en salsa picante de carne molida, pasta de poroto y pimienta de Sichuan. ¡Pica de verdad!', 'imagenes/mapo-tofu.jpg', 1, 0, 1],

  // Arroces y Fideos (categoria_id = 5)
  ['Arroz Chaufa', '炒饭', 5, 6990, 'Arroz frito peruano-chino con huevo, cebollín, verduras y tu elección de pollo o cerdo.', 'imagenes/arroz-chaufa.jpg', 0, 0, 1],
  ['Fideos Salteados', '炒面', 5, 6990, 'Fideos de trigo salteados al wok con verduras, brotes de soya y salsa de soya. Con pollo o verduras.', 'imagenes/fideos-salteados.jpg', 0, 0, 1],
  ['Arroz con Verduras', '蔬菜饭', 5, 5490, 'Arroz blanco al vapor salteado con mix de verduras frescas y un toque de salsa de soya.', 'imagenes/arroz-verduras.jpg', 0, 1, 1],
  ['Chop Suey', '杂碎', 5, 7490, 'Mix de verduras salteadas al wok con carne a elección, servido sobre una cama de arroz.', 'imagenes/chop-suey.jpg', 0, 0, 1],

  // Postres (categoria_id = 6)
  ['Mochi de Té Verde', '抹茶麻薯', 6, 3490, '4 mochis helados de té verde matcha. Suaves, dulces y refrescantes.', 'imagenes/mochi-te-verde.jpg', 0, 1, 1],
  ['Plátano Caramelizado', '拔丝香蕉', 6, 4490, 'Plátano frito cubierto de caramelo caliente con semillas de sésamo. Un clásico dulce chino.', 'imagenes/platano-caramelizado.jpg', 0, 1, 1],

  // Bebidas (categoria_id = 7)
  ['Té Verde Chino', '中国绿茶', 7, 1990, 'Té verde jazmín servido caliente. La bebida tradicional por excelencia.', 'imagenes/te-verde.jpg', 0, 1, 1],
  ['Bebida Gasificada 350ml', '汽水', 7, 1490, 'Coca-Cola, Fanta o Sprite bien fría. 350ml.', 'imagenes/bebida.jpg', 0, 1, 1],
];

const insertarPlatos = db.transaction(() => {
  for (const plato of platos) {
    insertarPlato.run(...plato);
  }
});
insertarPlatos();
console.log(`✅ ${platos.length} platos insertados`);

console.log('\n🍜 Datos semilla cargados exitosamente.');
console.log('   Ejecuta "node server.js" para iniciar la aplicación.');
