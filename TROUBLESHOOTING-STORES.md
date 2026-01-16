# Solución de Problemas: "Error al guardar tienda"

## Diagnóstico del Error

He mejorado el manejo de errores para que te muestre el problema específico. Ahora verás uno de estos mensajes:

### 1. "Ya existe una tienda con ese nombre"
**Causa**: Intentas crear una tienda con un nombre que ya existe.

**Solución**:
- Usa un nombre diferente
- O edita la tienda existente en lugar de crear una nueva

### 2. "Error de permisos. Verifica tu sesión"
**Causa**: Problemas con Row Level Security (RLS) en Supabase.

**Solución**:
1. Cierra sesión y vuelve a iniciar sesión
2. Si persiste, verifica en Supabase que las políticas RLS están activas:
   ```sql
   -- Verifica las políticas de stores
   SELECT * FROM pg_policies WHERE tablename = 'stores';
   ```

### 3. "Error de base de datos. Ejecuta la migración de tiendas"
**Causa**: La tabla `stores` no existe o no tiene la estructura correcta.

**Solución**:
Ejecuta la migración en Supabase:
1. Ve a https://app.supabase.com → Tu proyecto
2. SQL Editor → New query
3. Ejecuta el contenido de `database/05-stores-schema.sql`
4. O ejecuta `database/migration-incremental.sql` (incluye stores, tags, bundles)

### 4. Otro mensaje de error
**Causa**: Error específico de Supabase.

**Solución**:
- Abre la consola del navegador (F12)
- Ve a la pestaña "Console"
- Busca el log que dice "Error saving store:"
- Copia el error completo y revisa qué dice

## Verificación Paso a Paso

### Paso 1: Verifica que la tabla existe
Ejecuta en Supabase SQL Editor:
```sql
SELECT * FROM stores LIMIT 5;
```

**Si da error "relation does not exist"**:
- La tabla no existe → Ejecuta `database/05-stores-schema.sql`

**Si devuelve datos**:
- La tabla existe ✅ → Continúa al paso 2

### Paso 2: Verifica tus tiendas actuales
```sql
SELECT name FROM stores WHERE user_id = auth.uid();
```

Esto te muestra las tiendas que ya tienes. Si intentas crear una con el mismo nombre, fallará.

### Paso 3: Verifica RLS policies
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stores';
```

Debes ver al menos estas policies:
- `Users can view own stores` (SELECT)
- `Users can insert own stores` (INSERT)
- `Users can update own stores` (UPDATE)
- `Users can delete own stores` (DELETE)

**Si no las ves**:
- Ejecuta `database/05-stores-schema.sql` completo

### Paso 4: Verifica el UNIQUE constraint
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name = 'stores';
```

Debe existir un constraint en `(user_id, name)`.

## Solución Rápida: Re-crear tabla

Si nada funciona, ejecuta esto en Supabase SQL Editor:

```sql
-- CUIDADO: Esto elimina todas las tiendas
DROP TABLE IF EXISTS stores CASCADE;

-- Luego ejecuta database/05-stores-schema.sql completo
```

## ¿Aún no funciona?

Envíame:
1. El mensaje de error exacto que ves en pantalla
2. El error de la consola (F12 → Console → busca "Error saving store:")
3. El resultado de:
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name = 'stores'
   );
   ```

Con esa info puedo ayudarte mejor.
