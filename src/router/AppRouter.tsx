import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ROUTES } from './routes';

// Páginas temporales (serán implementadas después)
const PurchasesPage = () => <div className="p-6"><h1 className="text-3xl font-display font-bold">Compras</h1><p className="text-neutral-600 mt-2">Página en construcción</p></div>;
const ProductsPage = () => <div className="p-6"><h1 className="text-3xl font-display font-bold">Productos</h1><p className="text-neutral-600 mt-2">Página en construcción</p></div>;
const ProfilePage = () => <div className="p-6"><h1 className="text-3xl font-display font-bold">Perfil</h1><p className="text-neutral-600 mt-2">Página en construcción</p></div>;
const NotFoundPage = () => <div className="p-6 text-center"><h1 className="text-3xl font-display font-bold">404 - Página no encontrada</h1></div>;

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (Auth) */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.AUTH.SIGNUP} element={<SignupPage />} />

        {/* Rutas protegidas (App) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.APP.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.APP.PURCHASES} element={<PurchasesPage />} />
          <Route path={ROUTES.APP.PRODUCTS} element={<ProductsPage />} />
          <Route path={ROUTES.APP.PROFILE} element={<ProfilePage />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to={ROUTES.APP.DASHBOARD} replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
