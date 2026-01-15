# 🚀 Dakino - Inicio Rápido

Guía ultra-rápida para poner Dakino en marcha en menos de 2 minutos.

## Opción 1: Docker (Más Fácil) ⭐

### Requisitos
- Docker o OrbStack instalado

### Comandos

```bash
# 1. Iniciar todo
make dev

# 2. Esperar 30 segundos...

# 3. Abrir navegador
open http://localhost:3100
```

**¡Listo!** Ya tienes:
- ✅ Frontend en http://localhost:3100
- ✅ Supabase local corriendo (puerto 8100)
- ✅ Base de datos con schema cargado
- ✅ Hot-reload funcionando

> 💡 **Puertos únicos**: Dakino usa puertos 31xx/81xx/544xx para NO colisionar con otros proyectos de Supabase.

### Comandos Útiles

```bash
make stop      # Detener todo
make logs      # Ver logs
make reset-db  # Resetear datos
```

---

## Opción 2: Local (Sin Docker)

### Requisitos
- Node.js 18+
- Cuenta de Supabase

### Pasos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar Supabase:**
   - Ir a https://supabase.com
   - Crear proyecto
   - Ir a SQL Editor
   - Copiar y ejecutar `database/schema.sql`
   - Ir a Storage, crear bucket `product-images`

3. **Variables de entorno:**
   ```bash
   # Crear .env.local con:
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_key
   VITE_SUPABASE_STORAGE_BUCKET=product-images
   ```

4. **Iniciar:**
   ```bash
   npm run dev
   ```

---

## Primer Uso

1. Abre http://localhost:3100
2. Click en "Regístrate"
3. Crea tu cuenta
4. ¡Empieza a registrar compras!

## Acceso a Servicios

- **App**: http://localhost:3100
- **Supabase Studio**: http://localhost:54423 (admin de DB)
- **Mail Catcher**: http://localhost:54424 (ver emails de prueba)

## ¿Problemas?

Ver documentación completa:
- [README.md](./README.md) - Guía general
- [DOCKER.md](./DOCKER.md) - Guía de Docker

## Comandos Make Disponibles

```bash
make help       # Ver todos los comandos
make dev        # Iniciar desarrollo
make stop       # Detener servicios
make restart    # Reiniciar todo
make logs       # Ver logs
make reset-db   # Resetear base de datos
make clean      # Limpiar todo
```
