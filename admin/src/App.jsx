import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLayout from './components/AdminLayout';
import { LoginPage, Dashboard, Users, Orders, Admins, Activity } from './pages/AllPages';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// Auth guard — uses Forest/Copper palette, no purple
const Guard = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-deep)' }}>
      <div style={{ width:32, height:32, border:'2px solid rgba(44,95,93,0.25)', borderTopColor:'var(--copper)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return admin ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AdminAuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(14,22,18,0.98)',
                color: '#F8F4EC',
                border: '1px solid rgba(94,139,126,0.25)',
                borderRadius: 12,
                fontSize: 13,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary:'#7AAE8E', secondary:'rgba(14,22,18,0.98)' } },
              error:   { iconTheme: { primary:'#E08060', secondary:'rgba(14,22,18,0.98)' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/" element={<Guard><AdminLayout/></Guard>}>
              <Route index element={<Navigate to="/dashboard" replace/>}/>
              <Route path="dashboard" element={<Dashboard/>}/>
              <Route path="users"     element={<Users/>}/>
              <Route path="orders"    element={<Orders/>}/>
              <Route path="admins"    element={<Admins/>}/>
              <Route path="activity"  element={<Activity/>}/>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}
