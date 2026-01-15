#!/bin/bash

# Script para verificar que todo está configurado correctamente

set -e

echo "🔍 Verificando configuración de Dakino..."
echo ""

# Verificar Docker
echo "1. Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker no está instalado"
    echo "   💡 Instala Docker Desktop u OrbStack: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    echo "   ❌ Docker no está corriendo"
    echo "   💡 Inicia Docker Desktop u OrbStack"
    exit 1
fi
echo "   ✅ Docker está corriendo"

# Verificar docker-compose
echo "2. Verificando docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "   ⚠️  docker-compose no está instalado (pero puede funcionar con docker compose)"
fi
echo "   ✅ docker-compose disponible"

# Verificar archivos necesarios
echo "3. Verificando archivos necesarios..."

required_files=(
    "docker-compose.yml"
    "Dockerfile"
    "supabase/kong.yml"
    "database/schema.sql"
    "package.json"
)

all_present=true
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ Falta archivo: $file"
        all_present=false
    fi
done

if [ "$all_present" = true ]; then
    echo "   ✅ Todos los archivos necesarios presentes"
fi

# Verificar node_modules
echo "4. Verificando node_modules..."
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  node_modules no existe (se instalará en el contenedor)"
else
    echo "   ✅ node_modules presente"
fi

# Verificar puertos disponibles
echo "5. Verificando puertos disponibles..."
echo "   ℹ️  Dakino usa puertos únicos (31xx, 84xx, 544xx) para evitar conflictos"

ports=(3100 8100 54423 54422)
ports_in_use=()

for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        ports_in_use+=($port)
    fi
done

if [ ${#ports_in_use[@]} -eq 0 ]; then
    echo "   ✅ Todos los puertos necesarios están disponibles"
else
    echo "   ⚠️  Puertos en uso: ${ports_in_use[*]}"
    echo "   💡 Ver PORTS.md para cambiar puertos si es necesario"
fi

# Verificar Make (opcional)
echo "6. Verificando Make (opcional)..."
if command -v make &> /dev/null; then
    echo "   ✅ Make disponible (puedes usar 'make dev')"
else
    echo "   ⚠️  Make no disponible (usa './scripts/docker-dev.sh' o 'docker-compose up')"
fi

echo ""
echo "================================"
echo "Resumen:"
echo "================================"

if [ "$all_present" = true ] && docker info &> /dev/null 2>&1; then
    echo "✅ Tu setup está listo!"
    echo ""
    echo "Para iniciar Dakino:"
    if command -v make &> /dev/null; then
        echo "   make dev"
    else
        echo "   ./scripts/docker-dev.sh"
        echo "   o"
        echo "   docker-compose up --build -d"
    fi
else
    echo "❌ Hay problemas con tu setup"
    echo "   Revisa los errores arriba"
fi

echo ""
