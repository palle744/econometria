import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Warehouses } from './pages/Warehouses';
import { Clients } from './pages/Clients';
import { Inventory } from './pages/Inventory';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Scan } from './pages/Scan';
import { Orders } from './pages/Orders';
import { Users } from './pages/Users';
import { Collaborators } from './pages/Collaborators';


function App() {
  // const { user } = useAuthStore(); // user is not used here anymore

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/warehouses" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Warehouses />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/scan" element={
          <ProtectedRoute allowedRoles={['driver', 'admin', 'supervisor']}>
            <Scan />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/collaborators" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Collaborators />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
