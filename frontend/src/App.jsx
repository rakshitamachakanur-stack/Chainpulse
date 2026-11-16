import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import { Spinner } from './components/common/index.jsx';

// Shared pages
import LoginPage        from './pages/shared/LoginPage';
import ProfilePage      from './pages/shared/ProfilePage';
import NotificationsPage from './pages/shared/NotificationsPage';
import NotFoundPage     from './pages/shared/NotFoundPage';

// Procurement pages
import ProcDashboard    from './pages/procurement/Dashboard';
import RequisitionsPage from './pages/procurement/Requisitions';
import ReqDetailPage    from './pages/procurement/ReqDetail';
import ProcOrdersPage   from './pages/procurement/Orders';
import ProcSuppliersPage from './pages/procurement/Suppliers';
import ProcProductsPage from './pages/procurement/Products';
import ProcReportsPage  from './pages/procurement/Reports';

// Warehouse pages
import WhDashboard      from './pages/warehouse/Dashboard';
import InventoryPage    from './pages/warehouse/Inventory';
import ReceivingPage    from './pages/warehouse/Receiving';
import DispatchPage     from './pages/warehouse/Dispatch';
import TransfersPage    from './pages/warehouse/Transfers';
import WhReportsPage    from './pages/warehouse/Reports';

// Logistics pages
import LogDashboard     from './pages/logistics/Dashboard';
import ShipmentsPage    from './pages/logistics/Shipments';
import DeliveriesPage   from './pages/logistics/Deliveries';
import FleetPage        from './pages/logistics/Fleet';
import TrackingPage     from './pages/logistics/Tracking';
import LogReportsPage   from './pages/logistics/Reports';

// Manager pages
import MgrDashboard     from './pages/manager/Dashboard';
import ApprovalsPage    from './pages/manager/Approvals';
import MgrOrdersPage    from './pages/manager/Orders';
import MgrSuppliersPage from './pages/manager/Suppliers';
import MgrInventoryPage from './pages/manager/Inventory';
import MgrShipmentsPage from './pages/manager/Shipments';
import AnalyticsPage    from './pages/manager/Analytics';
import MgrReportsPage   from './pages/manager/Reports';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,          // always consider data stale - refetch on focus
      refetchOnWindowFocus: true,   // refetch when user switches tab back
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const ROLE_HOME = { procurement:'/dashboard', warehouse:'/dashboard', logistics:'/dashboard', manager:'/dashboard' };

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size="lg" className="text-blue-500" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner size="lg" className="text-blue-500" /></div>;
  return user ? <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace /> : children;
}

function RoleRoutes() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <Routes>
      {/* Shared */}
      <Route path="/profile"       element={<ProfilePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />

      {/* Procurement */}
      {role === 'procurement' && <>
        <Route path="/dashboard"    element={<ProcDashboard />} />
        <Route path="/requisitions" element={<RequisitionsPage />} />
        <Route path="/requisitions/:id" element={<ReqDetailPage />} />
        <Route path="/orders"       element={<ProcOrdersPage />} />
        <Route path="/suppliers"    element={<ProcSuppliersPage />} />
        <Route path="/products"     element={<ProcProductsPage />} />
        <Route path="/invoices"     element={<ProcReportsPage tab="invoices" />} />
        <Route path="/reports"      element={<ProcReportsPage />} />
      </>}

      {/* Warehouse */}
      {role === 'warehouse' && <>
        <Route path="/dashboard" element={<WhDashboard />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/receiving" element={<ReceivingPage />} />
        <Route path="/dispatch"  element={<DispatchPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/reports"   element={<WhReportsPage />} />
      </>}

      {/* Logistics */}
      {role === 'logistics' && <>
        <Route path="/dashboard"  element={<LogDashboard />} />
        <Route path="/shipments"  element={<ShipmentsPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/fleet"      element={<FleetPage />} />
        <Route path="/tracking"   element={<TrackingPage />} />
        <Route path="/reports"    element={<LogReportsPage />} />
      </>}

      {/* Manager */}
      {role === 'manager' && <>
        <Route path="/dashboard"  element={<MgrDashboard />} />
        <Route path="/approvals"  element={<ApprovalsPage />} />
        <Route path="/orders"     element={<MgrOrdersPage />} />
        <Route path="/suppliers"  element={<MgrSuppliersPage />} />
        <Route path="/inventory"  element={<MgrInventoryPage />} />
        <Route path="/shipments"  element={<MgrShipmentsPage />} />
        <Route path="/analytics"  element={<AnalyticsPage />} />
        <Route path="/reports"    element={<MgrReportsPage />} />
      </>}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            style: { background:'rgba(14,22,18,0.98)', color:'#F8F4EC', border:'1px solid rgba(94,139,126,0.25)', borderRadius:12, fontSize:13, backdropFilter:'blur(12px)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' },
            success: { iconTheme:{ primary:'#7AAE8E', secondary:'rgba(14,22,18,0.98)' } },
            error:   { iconTheme:{ primary:'#E08060', secondary:'rgba(14,22,18,0.98)' } },
          }} />
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<RoleRoutes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
