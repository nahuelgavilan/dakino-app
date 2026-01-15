# Scripts de Dakino

Colección de scripts útiles para desarrollo.

## Scripts Disponibles

### `docker-dev.sh`
Inicia el entorno completo de desarrollo con Docker.

```bash
./scripts/docker-dev.sh
```

**Hace:**
- Verifica que Docker está corriendo
- Construye e inicia todos los contenedores
- Muestra URLs de acceso y credenciales

### `docker-stop.sh`
Detiene todos los contenedores.

```bash
./scripts/docker-stop.sh
```

### `docker-logs.sh`
Muestra logs de un servicio específico.

```bash
# Ver logs del frontend
./scripts/docker-logs.sh frontend

# Ver logs de la base de datos
./scripts/docker-logs.sh db

# Ver logs de auth
./scripts/docker-logs.sh auth
```

### `docker-reset-db.sh`
Resetea la base de datos eliminando todos los datos.

```bash
./scripts/docker-reset-db.sh
```

**⚠️ ADVERTENCIA:** Esto eliminará TODOS los datos.

## Uso Recomendado

En lugar de usar estos scripts directamente, es más fácil usar `make`:

```bash
make dev          # = ./scripts/docker-dev.sh
make stop         # = ./scripts/docker-stop.sh
make logs         # = ./scripts/docker-logs.sh
make reset-db     # = ./scripts/docker-reset-db.sh
```

## Troubleshooting

Si los scripts no son ejecutables:

```bash
chmod +x scripts/*.sh
```
