import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Leer .env.docker o .env.local manualmente
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env.docker');
let supabaseUrl: string | undefined;
let supabaseKey: string | undefined;

try {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.replace('VITE_SUPABASE_URL=', '').trim();
      // Replace kong.orb.local with localhost for script execution
      if (supabaseUrl) {
        supabaseUrl = supabaseUrl.replace('kong.orb.local', 'localhost');
      }
    } else if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = trimmed.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
    }
  }
} catch (error) {
  console.error('❌ Error: No se pudo leer .env.local');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Ejecutando migraciones para TODOS los usuarios...\n');
  console.log('📝 Nota: Esto creará categorías y tiendas para todos los perfiles existentes\n');

  try {
    // Obtener TODOS los usuarios (profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email');

    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError.message);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos. Crea una cuenta primero.');
      process.exit(0);
    }

    console.log(`✅ Encontrados ${profiles.length} usuario(s)\n`);

    for (const profile of profiles) {
      console.log(`\n👤 Procesando usuario: ${profile.email} (${profile.id})`);

      // 1. Crear categorías por defecto
      console.log('  📦 Creando categorías por defecto...');
      const categories = [
        { name: 'Alimentos', icon: '🍎', color: '#10B981' },
        { name: 'Limpieza', icon: '🧹', color: '#0EA5E9' },
        { name: 'Salud', icon: '💊', color: '#EF4444' },
        { name: 'Hogar', icon: '🏠', color: '#F59E0B' },
        { name: 'Ropa', icon: '👕', color: '#9333EA' },
        { name: 'Entretenimiento', icon: '🎮', color: '#EC4899' },
        { name: 'Transporte', icon: '🚗', color: '#3B82F6' },
        { name: 'Tecnología', icon: '📱', color: '#F97316' },
      ];

      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .insert({
            user_id: profile.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            is_default: true,
          });

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            console.log(`     ⚠️  ${category.icon} ${category.name} ya existe (omitido)`);
          } else {
            console.error(`     ❌ Error creando ${category.name}:`, error.message);
          }
        } else {
          console.log(`     ✅ ${category.icon} ${category.name} creada`);
        }
      }

      // 2. Crear tiendas por defecto
      console.log('  🏪 Creando tiendas por defecto...');
      const stores = [
        { name: 'Mercadona', icon: '🛒', color: '#10B981' },
        { name: 'Carrefour', icon: '🏪', color: '#0EA5E9' },
        { name: 'Lidl', icon: '🏬', color: '#F59E0B' },
        { name: 'Aldi', icon: '🏭', color: '#EF4444' },
        { name: 'El Corte Inglés', icon: '🏢', color: '#9333EA' },
        { name: 'Día', icon: '🛍️', color: '#EC4899' },
        { name: 'Eroski', icon: '🏪', color: '#3B82F6' },
        { name: 'Alcampo', icon: '🏬', color: '#F97316' },
      ];

      for (const store of stores) {
        const { error } = await supabase
          .from('stores')
          .insert({
            user_id: profile.id,
            name: store.name,
            icon: store.icon,
            color: store.color,
            is_favorite: false,
          });

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            console.log(`     ⚠️  ${store.icon} ${store.name} ya existe (omitido)`);
          } else {
            console.error(`     ❌ Error creando ${store.name}:`, error.message);
          }
        } else {
          console.log(`     ✅ ${store.icon} ${store.name} creada`);
        }
      }
    }

    // 3. Verificar resultados
    console.log('\n📊 Verificando resultados...');

    for (const profile of profiles) {
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', profile.id);

      const { data: storesData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', profile.id);

      console.log(`\n👤 ${profile.email}:`);

      if (catError) {
        console.error('   ❌ Error verificando categorías:', catError.message);
      } else {
        console.log(`   ✅ Categorías: ${categoriesData?.length || 0}`);
      }

      if (storeError) {
        console.error('   ❌ Error verificando tiendas:', storeError.message);
      } else {
        console.log(`   ✅ Tiendas: ${storesData?.length || 0}`);
      }
    }

    console.log('\n🎉 Migraciones completadas!\n');
    console.log('📝 Recarga tu app (Cmd+R o Ctrl+R) para ver los cambios.\n');

  } catch (error: any) {
    console.error('\n❌ Error ejecutando migraciones:', error.message);
    process.exit(1);
  }
}

runMigration();
