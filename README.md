# Dakino - Registro de Compras PWA

Una aplicación web progresiva (PWA) vibrante y colorida para registrar y analizar tus compras diarias.

## Características

- 📱 **PWA Mobile-First**: Installable en móviles y escritorio con soporte offline
- 🎨 **Diseño Vibrante**: Sistema de colores colorido con rosa (#FF1744) como color principal
- 🔐 **Multi-usuario**: Autenticación segura con Supabase
- 🛒 **Registro Flexible**: Soporte para productos por unidad y por peso/granel
- 📦 **Catálogo Reutilizable**: Productos frecuentes para registro rápido
- 📊 **Dashboard con Estadísticas**: Gastos por día, semana, mes y año
- 🏷️ **Categorías y Etiquetas**: Organiza tus compras de forma intuitiva
- 📸 **Fotos de Productos**: Captura y almacena imágenes
- 📈 **Gráficos y Análisis**: Visualizaciones de tus patrones de gasto

## Stack Tecnológico

- **Frontend**: React 18 + Vite + TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + CSS custom
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa + Workbox

## Requisitos Previos

### Opción A: Desarrollo con Docker (Recomendado) 🐳
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) o [OrbStack](https://orbstack.dev/) (Mac)
- Make (opcional, viene en Mac/Linux)

### Opción B: Desarrollo Local
- Node.js 18+
- npm o yarn
- Cuenta de Supabase (gratuita)

## 🐳 Setup con Docker (Recomendado)

**Ventajas:**
- ✅ Supabase local incluido (no necesitas cuenta)
- ✅ Hot-reload automático
- ✅ Entorno consistente
- ✅ URLs amigables con OrbStack

### Inicio Rápido

```bash
# Con Make (más fácil)
make dev

# O con docker-compose directo
docker-compose up --build -d
```

**Accesos:**
- Frontend: http://frontend.orb.local:3100 (o http://localhost:3100)
- Supabase Studio: http://studio.orb.local:54423 (o http://localhost:54423)

> **💡 Nota**: Dakino usa puertos únicos (31xx, 81xx, 544xx) para NO colisionar con otros proyectos de Supabase que tengas corriendo.

**Comandos útiles:**
```bash
make dev          # Inicia todo
make stop         # Detiene todo
make logs         # Ver logs
make reset-db     # Resetea base de datos
make help         # Ver todos los comandos
```

📖 **Documentación completa**: Ver [DOCKER.md](./DOCKER.md)

---

## 💻 Setup Local (Sin Docker)

### 1. Instalar Dependencias

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Una vez creado, ve a **Settings** > **API** y copia:
   - `Project URL`
   - `anon public key`

### 3. Ejecutar el Schema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido completo de `database/schema.sql`
4. Ejecuta la query (Run)
5. Verifica que todas las tablas, triggers y policies se hayan creado correctamente

### 4. Configurar Storage

1. En Supabase, ve a **Storage**
2. Crea un nuevo bucket llamado `product-images`
3. Configura las políticas del bucket:
   - **Read**: Public access
   - **Insert**: Authenticated users only
   - **Update**: Authenticated users only (own files)
   - **Delete**: Authenticated users only (own files)

### 5. Variables de Entorno

1. Edita `.env.local` (o créalo desde `.env.example`) y añade tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   VITE_SUPABASE_STORAGE_BUCKET=product-images
   ```

### 6. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

## Uso

### Primer Uso

1. Abre la aplicación en `http://localhost:3000`
2. Haz clic en "Regístrate" para crear una cuenta
3. Completa el formulario de registro
4. Inicia sesión con tus credenciales
5. ¡Listo! Ya puedes empezar a registrar tus compras

### Registrar una Compra

1. Ve a la página de **Compras**
2. Haz clic en "Nueva Compra"
3. Selecciona o crea un producto
4. Elige el tipo:
   - **Por unidad**: Ingresa cantidad y precio unitario
   - **Por peso**: Ingresa peso (kg/litros) y precio por unidad
5. Selecciona una categoría
6. Opcionalmente añade una foto y notas
7. Guarda la compra

## Estructura del Proyecto

```
dakino_app/
├── database/          # Schema SQL de Supabase
├── public/            # Assets estáticos y iconos PWA
├── src/
│   ├── components/    # Componentes React organizados por feature
│   ├── hooks/         # Custom hooks
│   ├── pages/         # Páginas de la aplicación
│   ├── router/        # Configuración de React Router
│   ├── services/      # Servicios de API (Supabase)
│   ├── store/         # Zustand stores
│   ├── styles/        # Estilos globales y theme
│   ├── types/         # Tipos TypeScript
│   ├── utils/         # Utilidades y helpers
│   ├── App.tsx        # Componente principal
│   └── main.tsx       # Entry point
├── .env.example       # Ejemplo de variables de entorno
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## Características de Seguridad

- **Row Level Security (RLS)**: Cada usuario solo puede acceder a sus propios datos
- **Autenticación JWT**: Tokens seguros manejados por Supabase
- **Storage Policies**: Control granular de acceso a imágenes
- **Validación**: Validación de datos en frontend y backend

## PWA Features

- ✅ Installable en dispositivos móviles y escritorio
- ✅ Offline viewing de páginas cacheadas
- ✅ Service Worker con estrategia Network First para API
- ✅ Cache First para assets estáticos
- ✅ Manifest completo con iconos y shortcuts
- ✅ Optimizado para display standalone

## Estado del Proyecto

### Completado (MVP Fase 1)

- ✅ Proyecto inicializado con Vite + React + TypeScript
- ✅ Sistema de colores vibrante (Tailwind CSS + custom theme)
- ✅ Schema SQL completo con RLS y triggers
- ✅ Servicios de Supabase (Auth, Purchase, Product, Category, Storage, Statistics)
- ✅ Sistema de autenticación completo (Login, Signup, protección de rutas)
- ✅ Layout responsivo con navegación móvil
- ✅ Componentes comunes reutilizables (Button, Input, Card, Spinner)
- ✅ Hooks personalizados (useAuth, useToast)
- ✅ Router configurado con rutas protegidas

### Próximos Pasos

- [ ] Implementar formulario completo de compras
- [ ] Implementar catálogo de productos
- [ ] Implementar dashboard con estadísticas reales
- [ ] Quick Add Button (FAB flotante)
- [ ] Búsqueda en tiempo real de productos
- [ ] Gráficos interactivos
- [ ] Sistema de etiquetas
- [ ] Export de datos
- [ ] Offline sync completo

## Troubleshooting

### Error: Missing Supabase environment variables
- Verifica que `.env.local` existe y tiene las variables correctas
- Asegúrate de que el archivo empieza con `VITE_`
- Reinicia el dev server después de crear/modificar `.env.local`

### Error al ejecutar el schema SQL
- Asegúrate de copiar TODO el contenido de `database/schema.sql`
- Verifica que no hay errores de sintaxis en la salida
- Revisa que las tablas se crearon: `SELECT * FROM categories WHERE is_default = TRUE;`

### Errores de autenticación
- Verifica que el schema SQL se ejecutó correctamente
- Confirma que las RLS policies están activas
- Revisa la consola del navegador para ver detalles del error

## Licencia

MIT

---

**Desarrollado con ❤️ usando React, TypeScript y Supabase**
