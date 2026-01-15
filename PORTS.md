# Puertos de Dakino

Dakino usa puertos únicos para evitar conflictos con otros proyectos de Supabase local.

## 🔌 Puertos Principales

| Servicio | Puerto Host | Puerto Container | URL | Descripción |
|----------|-------------|------------------|-----|-------------|
| **Frontend** | 3100 | 3000 | http://localhost:3100 | React + Vite |
| **Supabase Studio** | 54423 | 3000 | http://localhost:54423 | UI de administración |
| **Kong API Gateway** | 8100 | 8000 | http://localhost:8100 | API Gateway (usar en VITE_SUPABASE_URL) |
| **PostgreSQL** | 54422 | 5432 | localhost:54422 | Base de datos |
| **Mail Catcher** | 54424 | 9000 | http://localhost:54424 | Ver emails de prueba |

### Con OrbStack

Si usas OrbStack, también puedes usar:
- Frontend: http://frontend.orb.local:3100
- Studio: http://studio.orb.local:54423
- Kong: http://kong.orb.local:8100

## 🔧 Puertos de Servicios Internos

Estos puertos son solo para uso interno de Docker y NO necesitas accederlos directamente:

| Servicio | Puerto Host | Puerto Container |
|----------|-------------|------------------|
| Auth (GoTrue) | 9100 | 9999 |
| REST (PostgREST) | 3101 | 3000 |
| Realtime | 4100 | 4000 |
| Storage | 5100 | 5000 |
| ImgProxy | 5101 | 5001 |
| Meta | 8180 | 8080 |
| Inbucket SMTP | 54425 | 2500 |

## ⚙️ Cambiar Puertos

Si necesitas usar puertos diferentes, hay dos opciones:

### Opción 1: Crear docker-compose.override.yml

```yaml
version: '3.8'

services:
  frontend:
    ports:
      - "3200:3000"  # Cambiar a puerto 3200

  kong:
    ports:
      - "8200:8000"  # Cambiar a puerto 8200
```

Luego actualiza tu `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:8200
```

### Opción 2: Modificar docker-compose.yml directamente

Edita `docker-compose.yml` y cambia los puertos que necesites.

## 🔍 Ver Puertos en Uso

```bash
# Ver qué puertos está usando Dakino
docker-compose ps

# Ver todos los puertos en uso en tu sistema
lsof -i -P | grep LISTEN
```

## 🚨 Conflictos de Puertos

Si al ejecutar `make dev` ves errores como:
```
Error: port is already allocated
```

Significa que algún puerto ya está en uso. Para solucionarlo:

1. **Ver qué está usando el puerto:**
   ```bash
   lsof -i :3100  # Reemplaza 3100 con el puerto que falla
   ```

2. **Opciones:**
   - Detén el otro servicio que usa ese puerto
   - O cambia los puertos de Dakino usando `docker-compose.override.yml`

## 📝 Notas

- **¿Por qué puertos únicos?** Para evitar conflictos con otros proyectos de Supabase local que uses
- **Rango de puertos:** Dakino usa el rango 31xx, 41xx, 51xx, 81xx, 84xx, 91xx, 544xx
- **Cambios mínimos:** Solo necesitas cambiar Frontend y Kong si cambias puertos
