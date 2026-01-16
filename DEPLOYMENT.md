# 🚀 Guía de Deployment - Dakino PWA

Esta guía te ayudará a desplegar Dakino online en minutos.

---

## ✅ Pre-requisitos

Antes de desplegar, asegúrate de tener:

### 1. Base de Datos Supabase Configurada
- [ ] Proyecto creado en [Supabase](https://supabase.com)
- [ ] Migración `database/migration-incremental.sql` ejecutada
- [ ] Tablas verificadas (purchases, products, stores, tags, bundles)
- [ ] Storage bucket "product-images" creado con política pública

### 2. Variables de Entorno
- [ ] `VITE_SUPABASE_URL` - Tu URL de Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` - Tu anon key de Supabase

📍 **Dónde encontrarlas:**
1. Ve a tu proyecto en Supabase
2. Click en ⚙️ Settings → API
3. Copia "Project URL" y "anon public"

### 3. Build Local Funcional
```bash
# Prueba que el build funcione
npm run build

# Debería crear carpeta "dist" sin errores
```

---

## 🎯 Opción 1: Vercel (Recomendado - Más Rápido)

### Por qué Vercel:
- ✅ Deploy en 2 minutos
- ✅ SSL gratis
- ✅ CDN global automático
- ✅ Preview deployments en cada commit
- ✅ Dominio gratis: `dakino.vercel.app`

### Pasos:

#### A. Usando GitHub (Recomendado)

1. **Sube tu código a GitHub:**
   ```bash
   # Si no tienes repo remoto aún
   gh repo create dakino-app --public --source=. --remote=origin --push

   # O manualmente
   git remote add origin https://github.com/TU_USER/dakino-app.git
   git push -u origin main
   ```

2. **Deploy desde Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Conecta tu GitHub
   - Selecciona el repositorio `dakino-app`
   - Vercel detectará automáticamente que es Vite

3. **Configura variables de entorno:**
   - En el paso "Configure Project"
   - Agregar Environment Variables:
     ```
     VITE_SUPABASE_URL = https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1...
     ```

4. **Deploy!**
   - Click "Deploy"
   - Espera 1-2 minutos
   - Tu app estará en: `https://dakino.vercel.app`

#### B. Usando Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Seguir prompts:
# - Set up and deploy? Yes
# - Project name? dakino-app
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist

# Agregar variables de entorno
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy a producción
vercel --prod
```

---

## 🎯 Opción 2: Netlify

### Por qué Netlify:
- ✅ Muy similar a Vercel
- ✅ SSL gratis
- ✅ Forms y Functions integrados
- ✅ Dominio gratis: `dakino.netlify.app`

### Pasos:

#### A. Desde GitHub

1. **Sube código a GitHub** (mismo paso que Vercel)

2. **Deploy desde Netlify:**
   - Ve a [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import existing project"
   - Conecta GitHub
   - Selecciona tu repo
   - Build settings (auto-detectados por `netlify.toml`):
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Variables de entorno:**
   - Site settings → Environment variables
   - Agregar:
     ```
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     ```

4. **Deploy!**
   - Click "Deploy site"
   - Tu app estará en: `https://dakino.netlify.app`

#### B. Usando Netlify CLI

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Inicializar
netlify init

# Deploy
netlify deploy --prod
```

---

## 🎯 Opción 3: Cloudflare Pages

### Por qué Cloudflare:
- ✅ GRATIS ilimitado
- ✅ Red global ultra-rápida
- ✅ Workers integrados
- ✅ Analytics gratis

### Pasos:

1. **Sube a GitHub**

2. **Ve a Cloudflare Pages:**
   - [dash.cloudflare.com/pages](https://dash.cloudflare.com)
   - "Create a project"
   - Conecta GitHub
   - Selecciona repo

3. **Build settings:**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output: `dist`

4. **Variables de entorno:**
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy!**

---

## 🎯 Opción 4: Railway / Render

### Railway (si quieres un contenedor completo)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar
railway init

# Agregar variables
railway variables set VITE_SUPABASE_URL=xxx
railway variables set VITE_SUPABASE_ANON_KEY=xxx

# Deploy
railway up
```

### Render (opción estática gratis)

1. Ve a [render.com](https://render.com)
2. "New" → "Static Site"
3. Conecta GitHub
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Agregar env vars

---

## 🔧 Configuración Post-Deployment

### 1. Verifica que la PWA funcione

Después del deploy, abre tu app en Chrome/Edge:
1. F12 → Application → Service Workers
2. Deberías ver el service worker registrado
3. En mobile, Chrome te ofrecerá "Install app"

### 2. Configura dominio personalizado (Opcional)

#### Vercel:
- Settings → Domains → Add domain

#### Netlify:
- Domain management → Add custom domain

#### Cloudflare:
- Custom domains → Set up a domain

### 3. Verifica Supabase CORS

Si tienes errores de CORS:
1. Ve a Supabase Dashboard
2. Authentication → URL Configuration
3. Agregar tu dominio de producción a "Site URL" y "Redirect URLs"

Ejemplo:
```
Site URL: https://dakino.vercel.app
Redirect URLs:
  - https://dakino.vercel.app
  - https://dakino.vercel.app/**
```

### 4. Analytics (Opcional)

#### Vercel Analytics:
```bash
npm install @vercel/analytics
```

En `src/main.tsx`:
```typescript
import { inject } from '@vercel/analytics';
inject();
```

#### Google Analytics:
Agregar en `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

---

## 🐛 Troubleshooting

### Error: "Build failed"

**Solución:**
```bash
# Verifica que el build funcione local
npm run build

# Si falla, revisa errores TypeScript
npm run lint
```

### Error: "Environment variables not found"

**Solución:**
- Verifica que agregaste las env vars en la plataforma
- Asegúrate de que empiecen con `VITE_`
- Redeploy después de agregar variables

### Error: "Failed to fetch" o CORS

**Solución:**
- Agrega tu dominio de producción en Supabase → Authentication → URL Configuration
- Verifica que las env vars de Supabase sean correctas

### PWA no se instala

**Solución:**
- Verifica que el manifest.json se sirva con content-type correcto
- Asegúrate de estar en HTTPS (localhost o dominio con SSL)
- Revisa en DevTools → Application → Manifest

### Imágenes no cargan

**Solución:**
- Verifica que el bucket de Supabase sea público
- Ve a Storage → product-images → Settings → "Public bucket"

---

## 📊 Comparación de Plataformas

| Feature | Vercel | Netlify | Cloudflare | Railway |
|---------|--------|---------|------------|---------|
| Deploy gratis | ✅ | ✅ | ✅ | ⚠️ $5/mes |
| SSL automático | ✅ | ✅ | ✅ | ✅ |
| CDN global | ✅ | ✅ | ✅ | ❌ |
| Preview deploys | ✅ | ✅ | ✅ | ✅ |
| Build tiempo | ~2 min | ~2 min | ~2 min | ~3 min |
| Dominio gratis | ✅ .vercel.app | ✅ .netlify.app | ✅ .pages.dev | ✅ .up.railway.app |
| Analytics | 💰 Paid | 💰 Paid | ✅ Gratis | ❌ |

**Recomendación:** Usa **Vercel** o **Netlify** para empezar.

---

## ✅ Checklist Final

Antes de anunciar tu app:

- [ ] App desplegada y accesible
- [ ] PWA instalable en mobile
- [ ] Login/Signup funciona
- [ ] Imágenes se suben correctamente
- [ ] Las 8 tiendas aparecen automáticamente
- [ ] Calendario muestra compras
- [ ] Dark mode funciona
- [ ] Export de datos funciona
- [ ] Responsive en mobile

---

## 🎉 ¡Listo!

Tu app está online en:
- Vercel: `https://tu-proyecto.vercel.app`
- Netlify: `https://tu-proyecto.netlify.app`
- Cloudflare: `https://tu-proyecto.pages.dev`

Comparte el link y empieza a usar Dakino! 🛒✨

---

## 🔄 Continuous Deployment

Una vez conectado a GitHub, cada `git push` desplegará automáticamente:
```bash
git add .
git commit -m "Nueva feature"
git push

# ✨ Auto-deploy en 1-2 minutos!
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de build en tu plataforma
2. Verifica variables de entorno
3. Revisa la consola del navegador (F12)
4. Verifica que las migraciones SQL se ejecutaron en Supabase
