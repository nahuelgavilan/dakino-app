# Arreglo: Categorías Vacías

## Problema Detectado

Los selectores de categoría aparecían vacíos porque:
1. ❌ El código no pasaba el `userId` al servicio de categorías
2. ❌ No existía trigger para crear categorías por defecto al registrar usuario

## Solución Implementada

### 1. Arreglos en el Código ✅

Se corrigieron los siguientes archivos:
- `src/components/purchases/PurchaseForm.tsx` - Ahora pasa `user.id` a `categoryService.getCategories()`
- `src/pages/purchases/PurchaseEditPage.tsx` - Ahora pasa `user.id` a `categoryService.getCategories()`
- `database/01-categories-defaults.sql` - Función para crear 8 categorías por defecto
- `database/02-auth-trigger.sql` - Trigger actualizado para crear categorías automáticamente

### 2. Migración de Base de Datos 🔧

**IMPORTANTE**: Debes ejecutar el script de migración en Supabase para que funcione.

#### Pasos:

1. **Abre Supabase Dashboard**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto Dakino

2. **Ve al SQL Editor**
   - En el menú lateral, click en "SQL Editor"
   - Click en "New query"

3. **Ejecuta la Migración**
   - Copia TODO el contenido de `database/migration-categories.sql`
   - Pégalo en el editor SQL
   - Click en "Run" (botón verde)

4. **Verifica el Resultado**
   - Deberías ver un mensaje de éxito
   - La última query muestra cuántas categorías tiene cada usuario (debe ser 8)

## Categorías Creadas por Defecto

Cada usuario nuevo (y existente después de la migración) tendrá estas 8 categorías:

| Categoría | Icono | Color |
|-----------|-------|-------|
| Alimentos | 🍎 | Verde (#10B981) |
| Limpieza | 🧹 | Azul (#0EA5E9) |
| Salud | 💊 | Rojo (#EF4444) |
| Hogar | 🏠 | Ámbar (#F59E0B) |
| Ropa | 👕 | Morado (#9333EA) |
| Entretenimiento | 🎮 | Rosa (#EC4899) |
| Transporte | 🚗 | Azul claro (#3B82F6) |
| Tecnología | 📱 | Naranja (#F97316) |

## Verificación

Después de ejecutar la migración:

1. **Recarga la app** (Cmd+R o Ctrl+R)
2. **Ve a "Nueva Compra"**
3. **Click en "Selecciona una categoría"**
4. **Deberías ver las 8 categorías** con sus iconos y nombres

## Usuarios Futuros

Los nuevos usuarios que se registren automáticamente tendrán:
- ✅ 8 categorías por defecto
- ✅ 8 tiendas/supermercados por defecto

Todo se crea automáticamente gracias al trigger actualizado.

## Solución de Problemas

### Si las categorías siguen sin aparecer:

1. **Verifica la migración**:
   ```sql
   SELECT COUNT(*) FROM categories WHERE user_id = auth.uid();
   ```
   Debe devolver 8.

2. **Verifica la consola del navegador**:
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - ¿Hay algún error rojo?

3. **Verifica el Network tab**:
   - En DevTools, pestaña "Network"
   - Recarga la página
   - Busca la llamada a `/rest/v1/categories`
   - ¿Qué respuesta devuelve?

Si persiste el problema, avísame con el mensaje de error específico.
