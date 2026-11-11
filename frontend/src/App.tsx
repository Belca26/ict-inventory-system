import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import AssetsListPage from '@/features/assets/AssetsListPage';
import AssetDetailPage from '@/features/assets/AssetDetailPage';
import AssetFormPage from '@/features/assets/AssetFormPage';
import MaintenancePage from '@/features/maintenance/MaintenancePage';
import MaintenanceDetailPage from '@/features/maintenance/MaintenanceDetailPage';
import MaintenanceFormPage from '@/features/maintenance/MaintenanceFormPage';
import SearchPage from '@/features/search/SearchPage';
import ReportsPage from '@/features/reports/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsListPage />} />
                <Route path="/assets/new" element={<AssetFormPage />} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/maintenance/new" element={<MaintenanceFormPage />} />
                <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<p className="p-6 text-sm text-muted-foreground">Page not found.</p>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
