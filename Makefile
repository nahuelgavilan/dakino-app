.PHONY: help dev stop restart logs logs-frontend logs-db reset-db clean build shell-frontend shell-db studio

# Colores para output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Muestra esta ayuda
	@echo "$(BLUE)Dakino - Comandos disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

dev: ## Inicia el entorno de desarrollo
	@echo "$(BLUE)🚀 Iniciando Dakino en modo desarrollo...$(NC)"
	@docker-compose up --build -d
	@echo ""
	@echo "$(GREEN)✅ Dakino está listo!$(NC)"
	@echo ""
	@echo "$(YELLOW)📱 Accesos:$(NC)"
	@echo "   Frontend:        http://localhost:3100"
	@echo "   Supabase Studio: http://localhost:54423"
	@echo "   Mail Catcher:    http://localhost:54424"
	@echo ""
	@echo "$(YELLOW)🌐 Con OrbStack:$(NC)"
	@echo "   Frontend:        http://frontend.orb.local:3100"
	@echo "   Kong API:        http://kong.orb.local:8100"
	@echo ""

stop: ## Detiene todos los servicios
	@echo "$(RED)🛑 Deteniendo servicios...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✅ Servicios detenidos$(NC)"

restart: stop dev ## Reinicia todos los servicios

logs: ## Muestra todos los logs (Ctrl+C para salir)
	@docker-compose logs -f

logs-frontend: ## Muestra logs del frontend
	@docker-compose logs -f frontend

logs-db: ## Muestra logs de la base de datos
	@docker-compose logs -f db

logs-auth: ## Muestra logs de auth
	@docker-compose logs -f auth

reset-db: ## Resetea la base de datos (ELIMINA TODOS LOS DATOS)
	@echo "$(RED)⚠️  Esto eliminará TODOS los datos$(NC)"
	@read -p "¿Continuar? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "$(YELLOW)🗑️  Eliminando datos...$(NC)"
	@docker-compose down
	@docker volume rm dakino_app_db-data 2>/dev/null || true
	@docker volume rm dakino_app_storage-data 2>/dev/null || true
	@docker-compose up -d db
	@echo "$(YELLOW)⏳ Esperando a que la DB esté lista...$(NC)"
	@sleep 15
	@docker-compose up -d
	@echo "$(GREEN)✅ Base de datos reseteada$(NC)"

clean: ## Elimina containers, volúmenes e imágenes
	@echo "$(RED)🧹 Limpiando todo...$(NC)"
	@docker-compose down -v --rmi local
	@echo "$(GREEN)✅ Limpieza completa$(NC)"

build: ## Reconstruye las imágenes
	@echo "$(BLUE)🔨 Reconstruyendo imágenes...$(NC)"
	@docker-compose build --no-cache
	@echo "$(GREEN)✅ Imágenes reconstruidas$(NC)"

shell-frontend: ## Abre shell en el contenedor frontend
	@docker-compose exec frontend sh

shell-db: ## Abre psql en la base de datos
	@docker-compose exec db psql -U postgres

studio: ## Abre Supabase Studio en el navegador
	@open http://localhost:54423 || xdg-open http://localhost:54423

ps: ## Muestra el estado de los contenedores
	@docker-compose ps

install: ## Instala dependencias (si no están instaladas)
	@if [ ! -d "node_modules" ]; then \
		echo "$(BLUE)📦 Instalando dependencias...$(NC)"; \
		npm install; \
		echo "$(GREEN)✅ Dependencias instaladas$(NC)"; \
	else \
		echo "$(GREEN)✅ Dependencias ya instaladas$(NC)"; \
	fi
