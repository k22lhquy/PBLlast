import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import { fetchMe } from './store/slices/authSlice';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Simple Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, token } = useSelector((state) => state.auth);

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard (no access to login/register if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};


function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);

  // Initialize Me State
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchMe());
    }
  }, [token, isAuthenticated, dispatch]);

  return (
    <>
      <ToastContainer theme="dark" position="top-right" />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
