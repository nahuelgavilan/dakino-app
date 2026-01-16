# 📋 Migraciones de Base de Datos - Dakino

## 🚀 Instrucciones de Instalación

### Opción 1: Base de datos NUEVA (desde cero)

Si es la primera vez que configuras Supabase para Dakino:

1. **Ve a Supabase Dashboard** → Tu Proyecto → SQL Editor
2. **Ejecuta en orden:**
   ```sql
   -- 1. Schema base con todas las tablas principales
   database/schema.sql

   -- 2. Funcionalidades adicionales (todo en uno)
   database/migration-incremental.sql
   ```

### Opción 2: Base de datos EXISTENTE (ya ejecutaste schema.sql)

Si ya tienes la base de datos inicial y solo necesitas las nuevas funcionalidades:

1. **Ve a Supabase Dashboard** → Tu Proyecto → SQL Editor
2. **Ejecuta:**
   ```sql
   database/migration-incremental.sql
   ```

Este archivo incluye:
- ✅ **Bundles** - Listas de compras reutilizables
- ✅ **Tags** - Sistema de etiquetas personalizadas
- ✅ **Stores** - Tiendas/supermercados (con 8 por defecto)

---

## 📁 Archivos SQL Disponibles

| Archivo | Descripción | Cuándo usar |
|---------|-------------|-------------|
| `schema.sql` | Schema base completo | Primera instalación |
| `00-init-roles.sql` | Roles y permisos | Incluido en schema.sql |
| `02-auth-trigger.sql` | Trigger de autenticación | Incluido en schema.sql |
| `03-bundles-schema.sql` | Solo tabla de bundles | Si quieres ejecutar por separado |
| `04-tags-schema.sql` | Solo tabla de tags | Si quieres ejecutar por separado |
| `05-stores-schema.sql` | Solo tabla de stores | Si quieres ejecutar por separado |
| `migration-incremental.sql` | **03 + 04 + 05 combinados** | ⭐ Recomendado para updates |

---

## ✅ Verificación

Después de ejecutar las migraciones, verifica que todo esté correcto:

1. **Ve a** Table Editor en Supabase
2. **Deberías ver estas tablas:**
   - ✅ profiles
   - ✅ categories
   - ✅ products
   - ✅ purchases
   - ✅ bundles ⭐ NUEVA
   - ✅ bundle_items ⭐ NUEVA
   - ✅ tags ⭐ NUEVA
   - ✅ purchase_tags ⭐ NUEVA
   - ✅ stores ⭐ NUEVA

3. **Verifica las columnas nuevas:**
   - En `products`: columna `store_id`
   - En `purchases`: columna `store_id`

---

## 🔧 Funciones y Triggers

Después de ejecutar las migraciones, se habrán creado:

### Funciones:
- `create_default_stores(user_id)` - Crea 8 tiendas por defecto para un usuario

### Triggers:
- `trigger_create_default_stores` - Auto-crea tiendas cuando un usuario se registra
- `trigger_bundles_updated_at` - Actualiza timestamp de bundles
- `trigger_tags_updated_at` - Actualiza timestamp de tags
- `trigger_stores_updated_at` - Actualiza timestamp de stores

---

## 🏪 Tiendas por Defecto

Cada usuario nuevo recibirá automáticamente estas 8 tiendas:

1. 🛒 Mercadona (verde)
2. 🏪 Carrefour (azul)
3. 🏬 Lidl (ámbar)
4. 🏭 Aldi (rojo)
5. 🏢 El Corte Inglés (morado)
6. 🛍️ Día (rosa)
7. 🏪 Eroski (azul)
8. 🏬 Alcampo (naranja)

---

## 🆘 Solución de Problemas

### Error: "relation already exists"
✅ **Normal** - Significa que la tabla ya existe. Puedes ignorarlo.

### Error: "column already exists"
✅ **Normal** - La columna ya fue agregada previamente.

### Error: "permission denied"
❌ **Problema** - Asegúrate de estar usando el SQL Editor con permisos de admin.

### ¿Cómo saber qué ya ejecuté?
```sql
-- Ver todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Ver columnas de una tabla
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'purchases';
```

---

## 📞 Notas Importantes

- ⚠️ **Row Level Security (RLS)** está habilitado en todas las tablas
- ⚠️ Cada usuario solo ve sus propios datos
- ⚠️ Las tiendas se crean automáticamente al registrarse
- ⚠️ Los triggers funcionan en el background, no necesitas hacer nada manual

---

## 🎯 Siguiente Paso

Una vez ejecutadas las migraciones:

1. Configura tus variables de entorno:
   ```bash
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

2. Ejecuta la app:
   ```bash
   npm run dev
   ```

3. Regístrate y verás las 8 tiendas automáticamente disponibles! 🎉
