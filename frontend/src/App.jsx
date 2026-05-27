import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import { fetchMe } from './store/slices/authSlice';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CommunityPage from './pages/CommunityPage';
import QAPage from './pages/QAPage';
import QADetailPage from './pages/QADetailPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import SearchUsersPage from './pages/SearchUsersPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';


const ThemeProvider = ({ children }) => {
  const { isDark } = useSelector((state) => state.theme);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return children;
};

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
  const { token, user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);

  // Initialize Me State
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [token, user, dispatch]);

  return (
    <ThemeProvider>
      <ToastContainer theme={isDark ? "dark" : "light"} position="top-right" />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/qa" element={<ProtectedRoute><QAPage /></ProtectedRoute>} />
        <Route path="/qa/:id" element={<ProtectedRoute><QADetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
        <Route path="/user/:id" element={
              <ProtectedRoute>
                <PublicProfilePage />
              </ProtectedRoute>
            } />
        <Route path="/search-users" element={
              <ProtectedRoute>
                <SearchUsersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
