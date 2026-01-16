export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
  },
  APP: {
    DASHBOARD: '/',
    PURCHASES: '/purchases',
    PURCHASES_NEW: '/purchases/new',
    PURCHASES_EDIT: '/purchases/:id',
    PRODUCTS: '/products',
    BUNDLES: '/bundles',
    BUNDLES_NEW: '/bundles/new',
    BUNDLES_EDIT: '/bundles/:id/edit',
    CATEGORIES: '/categories',
    TAGS: '/tags',
    ANALYTICS: '/analytics',
    STATISTICS: '/statistics',
    PROFILE: '/profile',
  },
} as const;
