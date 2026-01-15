#!/bin/bash

# Script para iniciar el entorno de desarrollo con Docker

set -e

echo "🚀 Iniciando Dakino en modo desarrollo con Docker..."
echo ""

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker no está corriendo. Por favor inicia Docker/OrbStack primero."
  exit 1
fi

# Construir e iniciar servicios
echo "📦 Construyendo e iniciando servicios..."
docker-compose up --build -d

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de servicios
echo ""
echo "🔍 Estado de servicios:"
docker-compose ps

echo ""
echo "✅ ¡Dakino está listo!"
echo ""
echo "📱 Accede a la aplicación:"
echo "   - Frontend:        http://frontend.orb.local:3100 (o http://localhost:3100)"
echo "   - Supabase Studio: http://studio.orb.local:54423 (o http://localhost:54423)"
echo "   - Mail Catcher:    http://localhost:54424"
echo ""
echo "🔑 Credenciales de Supabase Local:"
echo "   - URL:        http://kong.orb.local:8100 (o http://localhost:8100)"
echo "   - Anon Key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
echo ""
echo "ℹ️  Puertos únicos para Dakino (no colisionan con otros proyectos de Supabase)"
echo ""
echo "📊 Ver logs en tiempo real:"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 Para detener todo:"
echo "   docker-compose down"
echo ""
