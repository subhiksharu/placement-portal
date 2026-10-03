import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import TPODashboard from './pages/TPODashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/company" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/tpo" element={<ProtectedRoute role="tpo"><TPODashboard /></ProtectedRoute>} />
    </Routes>
  );
}