# Cómo Ejecutar Migración en Producción

## Pasos para ejecutar en Supabase Dashboard

### 1. Abre tu Supabase Dashboard
Ve a: https://app.supabase.com

### 2. Selecciona tu proyecto de Dakino

### 3. Ve al SQL Editor
En el menú lateral izquierdo, click en **"SQL Editor"**

### 4. Nueva Query
Click en **"New query"**

### 5. Copia el contenido del archivo
Abre el archivo: `database/MIGRATION-PRODUCCION.sql`

Copia **TODO** el contenido (desde `BEGIN;` hasta el final)

### 6. Pega en el SQL Editor
Pega todo el contenido en el editor de Supabase

### 7. Ejecuta
Click en el botón **"Run"** (verde, esquina inferior derecha)

### 8. Verifica el resultado
Deberías ver al final una tabla como esta:

```
           email           | categorias | tiendas
---------------------------+------------+---------
 usuario1@ejemplo.com      |          8 |       8
 usuario2@ejemplo.com      |          8 |       8
```

Cada usuario debe tener **8 categorías** y **8 tiendas**.

## ¿Qué hace esta migración?

✅ Agrega constraint UNIQUE a categorías (evita duplicados)
✅ Crea función `create_default_categories()`
✅ Crea función `create_default_stores()`
✅ Actualiza el trigger de autenticación para crear categorías/tiendas automáticamente
✅ Crea 8 categorías para TODOS los usuarios existentes
✅ Crea 8 tiendas para TODOS los usuarios existentes

## Categorías creadas:
- 🍎 Alimentos
- 🧹 Limpieza
- 💊 Salud
- 🏠 Hogar
- 👕 Ropa
- 🎮 Entretenimiento
- 🚗 Transporte
- 📱 Tecnología

## Tiendas creadas:
- 🛒 Mercadona
- 🏪 Carrefour
- 🏬 Lidl
- 🏭 Aldi
- 🏢 El Corte Inglés
- 🛍️ Día
- 🏪 Eroski
- 🏬 Alcampo

## Seguridad
✅ La migración es segura de ejecutar múltiples veces
✅ Usa `ON CONFLICT DO NOTHING` para evitar duplicados
✅ Solo crea categorías/tiendas si el usuario no tiene ninguna
✅ No modifica ni elimina datos existentes

## Después de ejecutar

1. **Recarga tu app en producción**
2. **Verifica que los selectores muestran las opciones**
3. **Los nuevos usuarios recibirán automáticamente las 8 categorías + 8 tiendas**

## Solución de Problemas

### Error: "relation does not exist"
**Problema**: Faltan tablas (categories o stores)
**Solución**: Ejecuta primero `database/schema.sql` completo

### Error: "function does not exist"
**Problema**: La función no se creó correctamente
**Solución**: Verifica que el script se ejecutó completo (incluyendo la sección de funciones)

### Error: "permission denied"
**Problema**: Permisos insuficientes
**Solución**: Asegúrate de estar ejecutando como usuario con permisos de admin

### No veo las categorías/tiendas en la app
1. Verifica que la consulta final muestra 8 categorías y 8 tiendas
2. Recarga la app (Cmd+R / Ctrl+R)
3. Cierra sesión y vuelve a iniciar sesión
4. Verifica que las variables de entorno apuntan a producción

---

Si encuentras algún problema, revisa los mensajes de NOTICE en el resultado de la query.
Deberían aparecer mensajes como:
- `NOTICE: Categorías creadas para: usuario@email.com`
- `NOTICE: Tiendas creadas para: usuario@email.com`
