export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
  },
  APP: {
    DASHBOARD: '/',
    // Gestión consolidada
    GESTION: '/gestion',
    // Compras
    PURCHASES: '/purchases',
    PURCHASES_NEW: '/purchases/new',
    PURCHASES_EDIT: '/purchases/:id',
    // Productos
    PRODUCTS: '/products',
    // Bundles/Listas
    BUNDLES: '/bundles',
    BUNDLES_NEW: '/bundles/new',
    BUNDLES_EDIT: '/bundles/:id/edit',
    // Inventario
    INVENTORY: '/inventory',
    INVENTORY_ITEM: '/inventory/:id',
    // Configuración
    CATEGORIES: '/categories',
    STORES: '/stores',
    TAGS: '/tags',
    // Otros
    CALENDAR: '/calendar',
    ANALYTICS: '/analytics',
    STATISTICS: '/statistics',
    PROFILE: '/profile',
  },
} as const;
