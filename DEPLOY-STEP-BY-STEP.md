# 🚀 Deployment de Dakino - Paso a Paso

## Tiempo estimado: 15-20 minutos

---

# PARTE 1: Preparar Supabase (Backend) ⚡

## Paso 1: Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Click en "Start your project" o "Sign in" si ya tienes cuenta
3. Click en "New Project"
4. Completa:
   - **Name**: `dakino` (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña (la necesitarás)
   - **Region**: Elige la más cercana a España (Europe West - Ireland)
   - **Pricing Plan**: Free (es suficiente para empezar)
5. Click "Create new project"
6. **Espera 2-3 minutos** mientras se crea el proyecto

---

## Paso 2: Ejecutar las migraciones SQL

1. En tu proyecto de Supabase, ve al menú lateral → **SQL Editor**
2. Click en "**+ New query**"
3. Abre el archivo `database/migration-incremental.sql` de tu proyecto local
4. **Copia TODO el contenido** del archivo
5. **Pega** en el editor de Supabase
6. Click en "**Run**" (o presiona Ctrl+Enter / Cmd+Enter)
7. Espera a que termine (verás mensajes como "Success. No rows returned")

### ✅ Verificación:
- Ve a **Table Editor** (menú lateral)
- Deberías ver estas tablas:
  - profiles
  - categories
  - products
  - purchases
  - bundles
  - bundle_items
  - tags
  - purchase_tags
  - stores ⭐ (importante)

---

## Paso 3: Configurar Storage para imágenes

1. Ve al menú lateral → **Storage**
2. Click en "**Create a new bucket**"
3. Completa:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **ACTÍVALO** (muy importante)
4. Click "Create bucket"

### ✅ Verificación:
- Deberías ver el bucket "product-images" en la lista
- Debe decir "Public" al lado del nombre

---

## Paso 4: Copiar credenciales de Supabase

1. Ve a **Settings** (⚙️ en el menú lateral)
2. Click en "**API**"
3. Busca y **copia estos dos valores**:

   **URL del proyecto:**
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   ```

   **Anon key:**
   ```
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Guárdalos en un archivo temporal** (los necesitarás en el Paso 9)

---

# PARTE 2: Preparar el código (Frontend) 📦

## Paso 5: Verificar que el build funciona

Abre la terminal en tu proyecto y ejecuta:

```bash
npm run build
```

### ✅ Verificación:
- Debería completarse sin errores
- Se creará una carpeta `dist/`
- Verás mensajes como "✓ built in XXXms"

### ❌ Si hay errores:
```bash
# Limpia e intenta de nuevo
rm -rf node_modules dist
npm install
npm run build
```

---

## Paso 6: Subir código a GitHub

### Opción A: Si ya tienes GitHub CLI instalado

```bash
# 1. Inicializar repo si no está inicializado
git init

# 2. Asegurar que todo está commiteado
git add -A
git commit -m "Ready for deployment"

# 3. Crear repo en GitHub y subir
gh repo create dakino-app --public --source=. --remote=origin --push
```

### Opción B: Manualmente desde GitHub.com

1. Ve a [https://github.com/new](https://github.com/new)
2. Completa:
   - **Repository name**: `dakino-app`
   - **Visibility**: Public (o Private si prefieres)
3. Click "Create repository"
4. En tu terminal, ejecuta los comandos que GitHub te muestra:

```bash
git remote add origin https://github.com/TU_USUARIO/dakino-app.git
git branch -M main
git push -u origin main
```

### ✅ Verificación:
- Ve a `https://github.com/TU_USUARIO/dakino-app`
- Deberías ver todos tus archivos

---

# PARTE 3: Deploy en Vercel 🚀

## Paso 7: Crear cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Click en "**Sign Up**"
3. **Importante**: Regístrate con la misma cuenta de GitHub que usaste
4. Autoriza a Vercel a acceder a tus repositorios

---

## Paso 8: Importar proyecto desde GitHub

1. En el dashboard de Vercel, click "**Add New...**" → "**Project**"
2. Busca `dakino-app` en la lista
3. Click "**Import**"
4. Vercel detectará automáticamente que es un proyecto Vite:
   - **Framework Preset**: Vite ✅
   - **Build Command**: `npm run build` ✅
   - **Output Directory**: `dist` ✅
   - **Install Command**: `npm install` ✅

**NO HAGAS CLICK EN DEPLOY TODAVÍA** → Primero agrega las variables de entorno

---

## Paso 9: Configurar Variables de Entorno

En la misma pantalla de configuración del proyecto:

1. Busca la sección "**Environment Variables**"
2. Agrega la primera variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Pega tu URL de Supabase (del Paso 4)
   - Click "Add"

3. Agrega la segunda variable:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Pega tu anon key de Supabase (del Paso 4)
   - Click "Add"

### Deberías tener 2 variables:
```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
```

---

## Paso 10: Deploy! 🎉

1. Click en "**Deploy**"
2. Espera 2-3 minutos mientras Vercel:
   - Instala dependencias (npm install)
   - Construye el proyecto (npm run build)
   - Despliega a producción
3. Verás una pantalla de celebración cuando termine 🎊

---

## Paso 11: Obtener tu URL

Vercel te dará una URL automática:
```
https://dakino-app.vercel.app
```

O algo similar con un nombre aleatorio si "dakino-app" ya está tomado.

**¡Copia esta URL!** La necesitarás en el siguiente paso.

---

# PARTE 4: Configurar CORS en Supabase 🔐

## Paso 12: Agregar tu dominio a Supabase

1. Vuelve a tu proyecto en Supabase
2. Ve a **Authentication** → **URL Configuration**
3. En "**Site URL**", pega tu URL de Vercel:
   ```
   https://tu-proyecto.vercel.app
   ```

4. En "**Redirect URLs**", agrega:
   ```
   https://tu-proyecto.vercel.app
   https://tu-proyecto.vercel.app/**
   ```

5. Click "**Save**"

---

# PARTE 5: Verificación Final ✅

## Paso 13: Probar la aplicación

1. Abre tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Deberías ver la página de login con el logo Dakino
3. Haz estas pruebas:

### ✅ Test 1: Registro
- Click en "Crear cuenta"
- Registra un nuevo usuario
- Deberías recibir email de confirmación de Supabase
- Confirma el email (si Supabase te pide)

### ✅ Test 2: Login
- Inicia sesión con tu usuario
- Deberías ver el Dashboard

### ✅ Test 3: Tiendas automáticas
- Ve a "Nueva Compra" (botón flotante +)
- Abre el selector de "Tienda / Supermercado"
- **Deberías ver las 8 tiendas**: Mercadona, Carrefour, Lidl, etc.
- Si NO aparecen → La migración SQL no se ejecutó correctamente

### ✅ Test 4: Crear compra
- Completa el formulario:
  - Producto: "Leche"
  - Categoría: "🍎 Alimentos"
  - Tienda: "🛒 Mercadona"
  - Cantidad: 2
  - Precio: 1.50
- Click "Guardar Compra"
- Deberías ver la compra en el Dashboard

### ✅ Test 5: Subir imagen
- Edita la compra
- Intenta subir una foto
- Si funciona → Storage está bien configurado
- Si falla → Revisa que el bucket sea público

### ✅ Test 6: PWA (opcional pero cool)
En Chrome mobile:
- Abre tu app
- Chrome te debería ofrecer "Instalar app"
- Instálala
- Debería abrirse como app nativa

---

# PARTE 6: Problemas Comunes 🔧

## Error: "Failed to fetch" o "Network error"

**Causa**: CORS no configurado
**Solución**:
1. Revisa el Paso 12
2. Asegúrate de que agregaste tu URL en Supabase
3. Puede tardar 1-2 minutos en aplicar

---

## Error: "No stores found" (sin tiendas)

**Causa**: La migración SQL no se ejecutó
**Solución**:
1. Ve a Supabase → SQL Editor
2. Ejecuta este comando para verificar:
   ```sql
   SELECT * FROM stores LIMIT 5;
   ```
3. Si está vacío, ejecuta de nuevo `database/migration-incremental.sql`

---

## Error: "Cannot upload image"

**Causa**: Bucket no es público
**Solución**:
1. Supabase → Storage → product-images
2. Click en los 3 puntos (...)
3. "Edit bucket"
4. Activa "Public bucket"
5. Save

---

## La app se ve rota o sin estilos

**Causa**: Build incorrecto
**Solución**:
1. Ve a Vercel → Tu proyecto → Deployments
2. Click en el último deployment
3. Ve a "Build Logs"
4. Busca errores en el log
5. Si hay errores, arregla local y haz `git push`

---

# PARTE 7: Actualizaciones Continuas 🔄

## Cómo actualizar la app después del deploy

Cada vez que hagas cambios:

```bash
# 1. Haz tus cambios en el código

# 2. Commit
git add -A
git commit -m "Descripción de tus cambios"

# 3. Push
git push

# 4. Vercel despliega automáticamente
# En 2-3 minutos tu app estará actualizada
```

### ✅ Verificar deployment:
- Ve a Vercel dashboard
- Verás el deployment "Building..."
- Espera a que diga "Ready"
- Refresca tu app

---

# PARTE 8: Dominio Personalizado (Opcional) 🌐

## Si quieres usar tu propio dominio

1. En Vercel → Settings → Domains
2. Click "Add"
3. Escribe tu dominio: `dakino.com`
4. Vercel te dará instrucciones DNS
5. Ve a tu proveedor de dominio
6. Agrega los registros DNS que Vercel te indica
7. Espera 5-10 minutos
8. ¡Listo! Tu app estará en tu dominio

**Recuerda actualizar Supabase** con el nuevo dominio en URL Configuration.

---

# 🎉 ¡FELICIDADES!

Tu app Dakino está online en:
```
https://tu-proyecto.vercel.app
```

## Próximos pasos:
- ✅ Comparte el link con amigos
- ✅ Instala la PWA en tu teléfono
- ✅ Empieza a registrar tus compras
- ✅ Explora el calendario y las estadísticas

## Recursos útiles:
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Logs de Vercel**: Para ver errores en producción
- **Supabase Logs**: Para ver queries de base de datos

---

## ¿Necesitas ayuda?

Si algo no funciona:
1. Revisa los logs en Vercel
2. Verifica la consola del navegador (F12)
3. Revisa que las migraciones SQL se ejecutaron
4. Asegúrate de que las env vars están configuradas

¡Disfruta de tu app! 🛍️✨
