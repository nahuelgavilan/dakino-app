import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PurchasesPage } from '@/pages/purchases/PurchasesPage';
import { PurchaseFormPage } from '@/pages/purchases/PurchaseFormPage';
import { PurchaseEditPage } from '@/pages/purchases/PurchaseEditPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { BundlesPage } from '@/pages/BundlesPage';
import { BundleFormPage } from '@/pages/BundleFormPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ROUTES } from './routes';

// Páginas temporales
const NotFoundPage = () => <div className="p-6 text-center"><h1 className="text-3xl font-display font-bold">404 - Página no encontrada</h1></div>;

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (Auth) */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.AUTH.SIGNUP} element={<SignupPage />} />

        {/* Rutas protegidas sin layout (full-screen) */}
        <Route
          path={ROUTES.APP.PURCHASES_NEW}
          element={
            <ProtectedRoute>
              <PurchaseFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.APP.PURCHASES_EDIT}
          element={
            <ProtectedRoute>
              <PurchaseEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.APP.BUNDLES_NEW}
          element={
            <ProtectedRoute>
              <BundleFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.APP.BUNDLES_EDIT}
          element={
            <ProtectedRoute>
              <BundleFormPage />
            </ProtectedRoute>
          }
        />

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
          <Route path={ROUTES.APP.BUNDLES} element={<BundlesPage />} />
          <Route path={ROUTES.APP.CALENDAR} element={<CalendarPage />} />
          <Route path={ROUTES.APP.ANALYTICS} element={<AnalyticsPage />} />
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
