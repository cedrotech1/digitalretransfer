import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/dashboard';
import Cookies from 'js-cookie';

// Pages
import Dashboard from './pages/dashboard';
import NewBaby from './pages/baby';
import Users from './pages/users';
import HealthCenter from './pages/healthcenter';
import Appointment from './pages/appointment';
import Notification from './pages/notifications';
import ForgetPassword from './pages/emailVerification';
import NotFound from './pages/notfound';
import Login from './pages/login';
import Report from './pages/report';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const email = Cookies.get('email');
  const token = Cookies.get('token');
  const role = Cookies.get('role');

  if (!email || !token || !role) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const email = Cookies.get('email');
  const token = Cookies.get('token');
  const role = Cookies.get('role');

  if (email && token && role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/borns"
          element={
            <ProtectedRoute>
              <NewBaby />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        <Route
          path="/healthcenter"
          element={
            <ProtectedRoute>
              <HealthCenter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <Appointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notification />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/forgotten-password"
          element={
            <PublicRoute>
              <ForgetPassword />
            </PublicRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
