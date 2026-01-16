# Cómo Agregar Variables de Entorno en Vercel

## El Error que Estás Viendo
```
Missing Supabase environment variables. Please check your .env.local file.
```

Esto significa que Vercel no tiene las credenciales de Supabase. Vamos a agregarlas ahora.

## Pasos para Solucionarlo

### 1. Ve a la Configuración del Proyecto
1. Ve a https://vercel.com/dashboard
2. Busca tu proyecto **dakino-app** en la lista
3. Click en el proyecto para abrirlo
4. Click en la pestaña **"Settings"** (arriba)

### 2. Agregar Variables de Entorno
1. En el menú lateral izquierdo, busca **"Environment Variables"**
2. Click en **"Environment Variables"**
3. Vas a agregar 3 variables, una por una:

#### Variable 1: VITE_SUPABASE_URL
- **Key (Name):** `VITE_SUPABASE_URL`
- **Value:** `https://cydjflmeulnhdlgmzfga.supabase.co`
- **Environments:** Marca las 3 opciones (Production, Preview, Development)
- Click **"Save"**

#### Variable 2: VITE_SUPABASE_ANON_KEY
- **Key (Name):** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZGpmbG1ldWxuaGRsZ216ZmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzU4MjksImV4cCI6MjA4NDA1MTgyOX0.nZM3KiTaX14HzPs1KSbQudkB7SiqFLQA0aD5isQPVJk`
- **Environments:** Marca las 3 opciones (Production, Preview, Development)
- Click **"Save"**

#### Variable 3: VITE_SUPABASE_STORAGE_BUCKET
- **Key (Name):** `VITE_SUPABASE_STORAGE_BUCKET`
- **Value:** `product-images`
- **Environments:** Marca las 3 opciones (Production, Preview, Development)
- Click **"Save"**

### 3. Hacer Redeploy
Una vez agregadas las 3 variables:
1. Ve a la pestaña **"Deployments"** (arriba)
2. Vas a ver el deployment más reciente (probablemente con estado "Ready")
3. Click en los **3 puntos (...)** al lado derecho del deployment
4. Selecciona **"Redeploy"**
5. En el popup que aparece, click en **"Redeploy"** nuevamente
6. Espera 1-2 minutos mientras Vercel hace el nuevo deploy

### 4. Probar la App
1. Una vez que termine el redeploy, click en **"Visit"** o abre la URL de tu app
2. La app debería cargar sin el error de variables de entorno
3. Intenta crear una cuenta o hacer login

## ¿Dónde está la URL de mi app?
- En Vercel Dashboard → Tu proyecto
- Arriba verás algo como: `https://dakino-app-xxxx.vercel.app`
- O simplemente click en **"Visit"** para abrir la app

## Siguiente Paso Importante (después del redeploy)

Una vez que la app funcione, necesitas copiar la URL de Vercel y agregarla en Supabase:

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto **dakino**
3. Ve a **Authentication** → **URL Configuration**
4. Agrega:
   - **Site URL:** `https://tu-app.vercel.app` (tu URL real)
   - **Redirect URLs:** (click "Add another URL" 2 veces)
     - `https://tu-app.vercel.app`
     - `https://tu-app.vercel.app/**`
5. Click **"Save"**

Esto evitará errores de CORS cuando intentes hacer login.

---

## Resumen Rápido

1. ✅ Vercel → Settings → Environment Variables
2. ✅ Agregar las 3 variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_STORAGE_BUCKET)
3. ✅ Deployments → Redeploy
4. ✅ Probar la app
5. ✅ Agregar URL de Vercel en Supabase → Authentication → URL Configuration

¡Listo! 🚀
