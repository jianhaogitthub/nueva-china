#!/bin/bash
# iniciar.sh — Script de inicio para Nueva China
# Doble clic para iniciar el servidor automáticamente

cd "$(dirname "$0")"

echo "🥢 Nueva China — Iniciando servidor..."
echo ""

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado."
    echo "   Instálalo desde: https://nodejs.org"
    echo "   Presiona cualquier tecla para salir..."
    read -n 1
    exit 1
fi

# Verificar que las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

# Verificar si la base de datos existe
if [ ! -f "nueva-china.db" ]; then
    echo "🗄️  Creando base de datos..."
    node seed.js
    echo ""
fi

echo "🍜 Abriendo Nueva China en el navegador..."
echo "   URL: http://localhost:3000"
echo ""
echo "   Presiona Ctrl+C para detener el servidor"
echo ""

# Abrir navegador automáticamente
sleep 1
open "http://localhost:3000"

# Iniciar servidor
node server.js
