import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import AnalysisDetails from './pages/AnalysisDetails';
import Profile from './pages/Profile';
import Realtime from './pages/Realtime';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

const App: React.FC = () => {
  const { user } = useAuth();
  const [_, forceUpdate] = React.useState(0);

  // Escutar mudanças no localStorage para sincronizar autenticação
  React.useEffect(() => {
    const handleStorageChange = () => {
      forceUpdate(prev => prev + 1); // Forçar re-renderização
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" /> : <Register />} 
      />
      
      {/* Rotas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="upload" element={<Upload />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="analysis/:id" element={<AnalysisDetails />} />
        <Route path="realtime" element={<Realtime />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Rota não encontrada */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default App;