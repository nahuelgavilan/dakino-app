#!/bin/bash

# Script para ver logs de los servicios

SERVICE=${1:-frontend}

echo "📊 Mostrando logs de: $SERVICE"
echo "   (Ctrl+C para salir)"
echo ""

docker-compose logs -f $SERVICE
