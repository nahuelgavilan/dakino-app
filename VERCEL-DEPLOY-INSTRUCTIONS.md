# Instrucciones para Deployment en Vercel

## Estado Actual
- ✅ Base de datos Supabase configurada y migrada
- ✅ Storage bucket público creado
- ✅ Código compilando sin errores
- ✅ Cambios pusheados a GitHub (main branch)
- ✅ Usuario loggeado en Vercel

## Credenciales de Producción (para configurar en Vercel)

```
VITE_SUPABASE_URL=https://cydjflmeulnhdlgmzfga.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGpmbG1ldWxuaGRsZ216ZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzU4MjksImV4cCI6MjA4NDA1MTgyOX0.nZM3KiTaX14HzPs1KSbQudkB7SiqFLQA0aD5isQPVJk
VITE_SUPABASE_STORAGE_BUCKET=product-images
```

## Pasos para Deployment

### 1. Ir a Vercel Dashboard
1. Abre tu navegador y ve a: https://vercel.com/dashboard
2. Deberías ver tu cuenta loggeada

### 2. Crear Nuevo Proyecto
1. Click en el botón **"Add New..."** (esquina superior derecha)
2. Selecciona **"Project"**
3. En la página "Import Git Repository":
   - Busca tu repositorio: **nahuelgavilan/dakino-app** o **dakino-app**
   - Click en **"Import"** al lado del repositorio

### 3. Configurar el Proyecto

Vercel debería detectar automáticamente que es un proyecto Vite. Verifica que la configuración sea:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**NO HAGAS CLICK EN DEPLOY TODAVÍA**

### 4. Agregar Variables de Entorno

Antes de hacer deploy, debes agregar las variables de entorno:

1. Busca la sección **"Environment Variables"**
2. Agrega estas 3 variables (una por una):

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://cydjflmeulnhdlgmzfga.supabase.co`
   - Environment: Production (y si quieres Preview y Development también)
   - Click "Add"

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGpmbG1ldWxuaGRsZ216ZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzU4MjksImV4cCI6MjA4NDA1MTgyOX0.nZM3KiTaX14HzPs1KSbQudkB7SiqFLQA0aD5isQPVJk`
   - Environment: Production (y si quieres Preview y Development también)
   - Click "Add"

   **Variable 3:**
   - Name: `VITE_SUPABASE_STORAGE_BUCKET`
   - Value: `product-images`
   - Environment: Production (y si quieres Preview y Development también)
   - Click "Add"

### 5. Deploy!

1. Una vez agregadas las 3 variables de entorno, haz click en **"Deploy"**
2. Vercel empezará a:
   - Clonar tu repositorio
   - Instalar dependencias (npm install)
   - Construir el proyecto (npm run build)
   - Desplegar a producción
3. Este proceso toma aproximadamente 2-3 minutos

### 6. Obtener la URL de Producción

Cuando el deployment termine:
1. Verás una pantalla de celebración con confeti 🎉
2. Copia la URL de producción (algo como `https://dakino-app.vercel.app` o `https://dakino-app-xxxx.vercel.app`)
3. **IMPORTANTE:** Guarda esta URL porque la necesitarás para el siguiente paso

### 7. Configurar CORS en Supabase

Una vez que tengas la URL de Vercel, necesitas agregarla a Supabase:

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona el proyecto `dakino`
3. Ve a **Authentication** → **URL Configuration** (en el menú lateral)
4. Agrega tu URL de Vercel en:
   - **Site URL:** `https://tu-app.vercel.app`
   - **Redirect URLs:**
     - `https://tu-app.vercel.app`
     - `https://tu-app.vercel.app/**`
5. Click **"Save"**

### 8. Probar la Aplicación

1. Abre tu URL de Vercel en el navegador
2. Prueba:
   - ✅ La página de login carga correctamente
   - ✅ Puedes crear una cuenta nueva
   - ✅ Puedes hacer login
   - ✅ El dashboard carga
   - ✅ Aparecen las 8 categorías y 8 tiendas por defecto
   - ✅ Puedes crear una nueva compra
   - ✅ Puedes subir una imagen

### 9. Deployment Automático (Bonus)

Cada vez que hagas `git push` a la rama main, Vercel desplegará automáticamente:

```bash
# Hacer cambios
git add .
git commit -m "Descripción del cambio"
git push origin main

# ✨ Auto-deploy en Vercel en 1-2 minutos!
```

## Troubleshooting

### Error: "Failed to fetch" o CORS
**Solución:** Asegúrate de haber agregado tu URL de Vercel en Supabase → Authentication → URL Configuration (Paso 7)

### Error: "Environment variables not found"
**Solución:**
1. Ve a tu proyecto en Vercel → Settings → Environment Variables
2. Verifica que las 3 variables estén configuradas
3. Si falta alguna, agrégala
4. Redeploy: Deployments → Click en los 3 puntos del último deploy → "Redeploy"

### La app se ve rota o sin estilos
**Solución:**
1. Ve a Vercel → Tu proyecto → Deployments
2. Click en el último deployment
3. Ve a "Build Logs"
4. Revisa si hay errores
5. Si hay errores, corrígelos localmente, haz commit y push

### Las tiendas no aparecen
**Solución:** La migración de Supabase ya está aplicada correctamente. Si creas un usuario nuevo, deberías ver automáticamente las 8 tiendas y 8 categorías.

## Resumen de lo que ya está hecho

✅ Schema de base de datos migrado (tablas: profiles, categories, stores, tags, products, purchases, bundles, bundle_items)
✅ Storage bucket "product-images" configurado como público
✅ Triggers para crear categorías y tiendas automáticamente al registrarse
✅ Row Level Security (RLS) configurado
✅ Código sin errores de TypeScript
✅ Build exitoso localmente

## Siguiente Paso

**Ve a https://vercel.com/dashboard y sigue los pasos 2-8 de arriba**

¡Éxito con el deployment!
