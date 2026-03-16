import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Suspects from './pages/Suspects';
import Graph from './pages/Graph';
import AIPage from './pages/AI';
import EvidencePage from './pages/Evidence';
import Login from './pages/Login';
import './index.css';

function AppLayout({ children }) {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="main-content">
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Initializing Justice AI...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/cases"       element={<ProtectedRoute><Cases /></ProtectedRoute>} />
      <Route path="/cases/:id"   element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
      <Route path="/suspects"    element={<ProtectedRoute><Suspects /></ProtectedRoute>} />
      <Route path="/suspects/:id" element={<ProtectedRoute><Suspects /></ProtectedRoute>} />
      <Route path="/graph"       element={<ProtectedRoute><Graph /></ProtectedRoute>} />
      <Route path="/ai"          element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
      <Route path="/evidence"    element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0a0e1a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0a0e1a' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
