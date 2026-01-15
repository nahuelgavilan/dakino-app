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
    CATEGORIES: '/categories',
    TAGS: '/tags',
    STATISTICS: '/statistics',
    PROFILE: '/profile',
  },
} as const;
