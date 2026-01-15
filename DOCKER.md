# Dakino - Guía de Desarrollo con Docker

Esta guía te ayudará a configurar y ejecutar Dakino completamente en Docker con Supabase local.

## 🎯 Ventajas de usar Docker

- ✅ **Entorno consistente**: Todos los desarrolladores usan las mismas versiones
- ✅ **Supabase local**: No necesitas internet ni cuenta de Supabase
- ✅ **Hot-reload**: Los cambios en el código se reflejan inmediatamente
- ✅ **Aislamiento**: No contaminas tu sistema local
- ✅ **OrbStack optimizado**: URLs amigables tipo `http://frontend.orb.local:3000`

## 📋 Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) o [OrbStack](https://orbstack.dev/) (recomendado para Mac)
- Make (opcional, viene preinstalado en Mac/Linux)

## 🚀 Inicio Rápido

### Opción 1: Usando Make (Recomendado)

```bash
# Ver todos los comandos disponibles
make help

# Iniciar todo el entorno
make dev

# Ver logs en tiempo real
make logs-frontend

# Detener todo
make stop
```

### Opción 2: Usando Scripts

```bash
# Iniciar el entorno
./scripts/docker-dev.sh

# Ver logs
./scripts/docker-logs.sh frontend

# Detener
./scripts/docker-stop.sh
```

### Opción 3: Usando Docker Compose directamente

```bash
# Iniciar
docker-compose up --build -d

# Ver logs
docker-compose logs -f frontend

# Detener
docker-compose down
```

## 🌐 Accesos

Una vez que los servicios estén corriendo, puedes acceder a:

> **💡 Puertos únicos**: Dakino usa puertos específicos (31xx, 81xx, 544xx) para NO colisionar con otros proyectos de Supabase local.

### Con OrbStack:
- **Frontend**: http://frontend.orb.local:3100
- **Supabase Studio**: http://studio.orb.local:54423
- **Kong API Gateway**: http://kong.orb.local:8100

### Con Docker Desktop (localhost):
- **Frontend**: http://localhost:3100
- **Supabase Studio**: http://localhost:54423
- **Kong API Gateway**: http://localhost:8100
- **PostgreSQL**: localhost:54422
- **Mail Catcher**: http://localhost:54424

📖 **Ver todos los puertos**: [PORTS.md](./PORTS.md)

## 🔑 Credenciales de Supabase Local

```bash
# URL de la API (usa la que corresponda a tu setup)
URL: http://kong.orb.local:8100  # OrbStack
URL: http://localhost:8100       # Docker Desktop

# Anon Key (pública)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service Role Key (privada - solo para desarrollo)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 📦 Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| frontend | 3100 | React + Vite con hot-reload |
| studio | 54423 | Supabase Studio (UI de administración) |
| kong | 8100 | API Gateway |
| db | 54422 | PostgreSQL 15 |
| auth | 9100 | GoTrue (autenticación) |
| rest | 3101 | PostgREST (API REST) |
| realtime | 4100 | Realtime subscriptions |
| storage | 5100 | Storage API |
| meta | 8180 | Metadata API |
| inbucket | 54424 | Mail catcher para emails |

## 🛠️ Comandos Útiles con Make

```bash
# Desarrollo
make dev              # Inicia todo
make stop             # Detiene todo
make restart          # Reinicia todo

# Logs
make logs             # Todos los logs
make logs-frontend    # Solo frontend
make logs-db          # Solo base de datos
make logs-auth        # Solo autenticación

# Base de datos
make reset-db         # Resetea la DB (elimina datos)
make shell-db         # Abre psql

# Mantenimiento
make ps               # Estado de contenedores
make clean            # Limpia todo (containers, volúmenes, imágenes)
make build            # Reconstruye imágenes

# Utilidades
make studio           # Abre Supabase Studio en navegador
make shell-frontend   # Shell en el contenedor frontend
```

## 🔧 Configuración

### Variables de Entorno

El archivo `.env.docker` contiene la configuración para Docker. Ya está configurado con valores por defecto que funcionan.

**Para OrbStack:**
```env
VITE_SUPABASE_URL=http://kong.orb.local:8000
```

**Para Docker Desktop:**
```env
VITE_SUPABASE_URL=http://localhost:8000
```

### Modificar el Frontend

Todos los cambios en el código se reflejan automáticamente gracias al hot-reload:

1. Edita cualquier archivo en `src/`
2. Guarda el archivo
3. El navegador se recarga automáticamente

### Modificar el Schema SQL

Si necesitas modificar el schema de la base de datos:

1. Edita `database/schema.sql`
2. Ejecuta:
   ```bash
   make reset-db
   ```
3. Esto recreará la base de datos con el nuevo schema

## 🐛 Troubleshooting

### Los contenedores no inician

```bash
# Ver logs de todos los servicios
make logs

# Ver logs de un servicio específico
docker-compose logs db
docker-compose logs auth
```

### Error de puertos en uso

Si un puerto ya está en uso:

```bash
# Ver qué está usando el puerto (ej: 3000)
lsof -i :3000

# Detener todo y limpiar
make clean
```

### La base de datos no responde

```bash
# Verificar estado
docker-compose ps

# Revisar logs de la DB
make logs-db

# Resetear la DB
make reset-db
```

### Hot-reload no funciona

```bash
# Reiniciar el frontend
docker-compose restart frontend

# Ver logs
make logs-frontend
```

### CORS errors

Si ves errores de CORS:
1. Verifica que estás usando la URL correcta (`http://kong.orb.local:8000` o `http://localhost:8000`)
2. Asegúrate de que Kong está corriendo: `docker-compose ps kong`
3. Revisa logs de Kong: `docker-compose logs kong`

## 🔍 Debugging

### Inspeccionar la Base de Datos

```bash
# Opción 1: Supabase Studio
open http://localhost:54323

# Opción 2: psql directo
make shell-db

# Dentro de psql:
\dt              # Listar tablas
\d+ purchases    # Describir tabla
SELECT * FROM categories WHERE is_default = TRUE;
```

### Inspeccionar Contenedores

```bash
# Estado de todos los contenedores
make ps

# Shell en el frontend
make shell-frontend

# Ver variables de entorno en el frontend
docker-compose exec frontend env | grep VITE
```

### Ver Emails de Prueba

Los emails enviados por Supabase Auth se pueden ver en:
- http://localhost:54324

## 📊 Volúmenes de Datos

Los datos persisten en volúmenes de Docker:

```bash
# Listar volúmenes
docker volume ls | grep dakino

# Eliminar volúmenes (ELIMINA DATOS)
docker volume rm dakino_app_db-data
docker volume rm dakino_app_storage-data
```

## 🚀 Workflow Recomendado

1. **Inicio del día:**
   ```bash
   make dev
   ```

2. **Desarrollar:**
   - Edita código en `src/`
   - Los cambios se reflejan automáticamente
   - Usa Supabase Studio para ver/modificar datos

3. **Ver logs si hay problemas:**
   ```bash
   make logs-frontend
   ```

4. **Final del día:**
   ```bash
   make stop
   ```

## 🔄 Actualizar Servicios

Para actualizar las imágenes de Supabase:

```bash
# Detener todo
make stop

# Actualizar imágenes
docker-compose pull

# Reiniciar
make dev
```

## 📝 Notas Importantes

1. **Primera vez**: El primer inicio puede tardar 2-3 minutos mientras descarga todas las imágenes

2. **Datos persistentes**: Los datos de la DB y Storage persisten entre reinicios

3. **Performance**: OrbStack es más rápido que Docker Desktop en Mac

4. **URLs amigables**: Si usas OrbStack, puedes usar URLs tipo `.orb.local` que son más fáciles de recordar

5. **CORS**: Kong está configurado para permitir `*` en desarrollo, lo que facilita el desarrollo local

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `make logs`
2. Verifica que Docker tiene suficiente RAM (mínimo 4GB recomendado)
3. Asegúrate de que no hay otros servicios usando los mismos puertos
4. Prueba `make clean` y luego `make dev` para empezar de cero

## 🎓 Recursos Adicionales

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [OrbStack Documentation](https://docs.orbstack.dev/)
- [Kong Gateway Documentation](https://docs.konghq.com/)
