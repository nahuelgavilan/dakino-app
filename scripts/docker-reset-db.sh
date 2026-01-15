#!/bin/bash

# Script para resetear la base de datos (elimina todos los datos)

set -e

echo "⚠️  Este script eliminará TODOS los datos de la base de datos."
read -p "¿Estás seguro? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
  echo "❌ Operación cancelada"
  exit 0
fi

echo "🗑️  Deteniendo servicios..."
docker-compose down

echo "🗑️  Eliminando volúmenes de datos..."
docker volume rm dakino_app_db-data 2>/dev/null || true
docker volume rm dakino_app_storage-data 2>/dev/null || true

echo "🚀 Reiniciando servicios..."
docker-compose up -d

echo "⏳ Esperando a que la base de datos esté lista..."
sleep 15

echo "✅ Base de datos reseteada correctamente"
echo "   La base de datos se ha recreado con el schema inicial"
