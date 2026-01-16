# 🚀 Ejecutar Schema Completo en Producción

## ⚠️ IMPORTANTE: Usar el archivo correcto

**Usa el archivo:** `database/FULL-SCHEMA-PRODUCTION.sql`

Este archivo contiene **TODO** el schema completo:
- ✅ Todas las tablas (profiles, categories, stores, tags, products, purchases, bundles, etc.)
- ✅ Todos los índices
- ✅ Todas las funciones y triggers
- ✅ Todas las políticas RLS
- ✅ Datos por defecto para usuarios existentes
- ✅ Es IDEMPOTENTE (seguro ejecutar múltiples veces)

## 📋 Pasos Simples

### 1. Abre Supabase Dashboard
https://app.supabase.com

### 2. Selecciona tu proyecto Dakino

### 3. Ve al SQL Editor
Menú lateral izquierdo → **"SQL Editor"**

### 4. Nueva Query
Click en **"New query"**

### 5. Copia TODO el archivo
Abre: `database/FULL-SCHEMA-PRODUCTION.sql`
Copia **TODO** el contenido (desde `BEGIN;` hasta el final)

### 6. Pega en el editor

### 7. Ejecuta
Click en **"Run"** (botón verde)

### 8. Espera a que termine
Verás mensajes de NOTICE indicando el progreso:
```
NOTICE: Categorías creadas para: tu@email.com
NOTICE: Tiendas creadas para: tu@email.com
```

### 9. Verifica el resultado final
Al final debe mostrar una tabla como esta:

```
           email           | categorias | tiendas | productos | compras
---------------------------+------------+---------+-----------+---------
 usuario@ejemplo.com       |          8 |       8 |         0 |       0
```

✅ **Cada usuario DEBE tener 8 categorías y 8 tiendas**

## ✨ ¿Qué crea este script?

### Tablas:
- profiles
- categories
- stores
- tags
- products
- purchases
- purchase_tags
- bundles
- bundle_items

### Funciones:
- `create_default_categories()` - Crea 8 categorías por usuario
- `create_default_stores()` - Crea 8 tiendas por usuario
- `handle_new_user()` - Trigger para nuevos registros
- Funciones de updated_at y product_usage

### 8 Categorías por defecto:
🍎 Alimentos • 🧹 Limpieza • 💊 Salud • 🏠 Hogar
👕 Ropa • 🎮 Entretenimiento • 🚗 Transporte • 📱 Tecnología

### 8 Tiendas por defecto:
🛒 Mercadona • 🏪 Carrefour • 🏬 Lidl • 🏭 Aldi
🏢 El Corte Inglés • 🛍️ Día • 🏪 Eroski • 🏬 Alcampo

## 🔒 Seguridad

✅ Seguro ejecutar múltiples veces (idempotente)
✅ Usa `CREATE IF NOT EXISTS` y `DROP IF EXISTS`
✅ Usa `ON CONFLICT DO NOTHING` para datos
✅ No modifica ni elimina datos existentes
✅ Solo crea lo que falta

## ✅ Después de ejecutar

1. **Recarga tu app en producción** (Cmd+R / Ctrl+R)
2. **Verifica que los selectores tienen opciones**
3. **Nuevos usuarios recibirán automáticamente todo**
4. **Puedes crear más categorías/tiendas desde la app**

## 🔧 Solución de Problemas

### ❌ Error: "permission denied for schema public"
**Causa**: Ejecutando con usuario sin permisos
**Solución**: Asegúrate de ejecutar en Supabase Dashboard (no psql directo)

### ❌ Error: "syntax error at or near..."
**Causa**: No copiaste el archivo completo
**Solución**: Asegúrate de copiar desde `BEGIN;` hasta el final

### ❌ No veo categorías/tiendas en la app
**Verifica:**
1. La query final mostró 8 categorías y 8 tiendas
2. Has recargado la app (Cmd+R)
3. Las variables de entorno apuntan a producción
4. La tabla `profiles` tiene tu usuario

### ❌ Algunos triggers fallan
**Causa**: Ya existen triggers antiguos
**Solución**: El script hace `DROP IF EXISTS`, debería funcionar. Si persiste:
```sql
-- Ejecuta esto primero
DROP TRIGGER IF EXISTS trigger_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS trigger_create_default_stores ON profiles;
-- Luego ejecuta el script completo
```

## 📝 Notas

- Este script reemplaza TODOS los archivos individuales (00-init-roles.sql, 01-categories-defaults.sql, etc.)
- Solo necesitas ejecutar este archivo UNA vez
- Es seguro ejecutarlo de nuevo si tienes dudas
- Incluye migraciones incrementales (agrega columnas si faltan)

## 🆘 ¿Sigue sin funcionar?

1. Abre la consola del navegador (F12)
2. Ve a Network tab
3. Recarga la app
4. Busca errores en las llamadas a `/rest/v1/categories` o `/rest/v1/stores`
5. Copia el error exacto

O ejecuta esto en SQL Editor para debug:
```sql
-- Ver usuarios
SELECT * FROM profiles;

-- Ver categorías por usuario
SELECT user_id, COUNT(*) FROM categories GROUP BY user_id;

-- Ver tiendas por usuario
SELECT user_id, COUNT(*) FROM stores GROUP BY user_id;
```
