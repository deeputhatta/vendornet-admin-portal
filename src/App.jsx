import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Orders from './pages/Orders';

function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>VendorNet</div>
        <p style={styles.adminLabel}>Admin Portal</p>
        <nav>
          {[
            { to: '/', label: '📊 Dashboard' },
            { to: '/users', label: '👥 Users' },
            { to: '/products', label: '📦 Products' },
            { to: '/orders', label: '🧾 Orders' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              ...styles.navLink, background: isActive ? '#0C447C' : 'transparent'
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.userBox}>
          <p style={styles.userName}>{user?.name}</p>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>
      <div style={styles.main}>{children}</div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  // container: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: 220, background: '#185FA5', display: 'flex', flexDirection: 'column', padding: '24px 0', height: '100vh', flexShrink: 0 },
  // sidebar: { width: 220, background: '#185FA5', display: 'flex', flexDirection: 'column', padding: '24px 0' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#fff', padding: '0 20px', marginBottom: 4 },
  adminLabel: { fontSize: 11, color: '#85B7EB', padding: '0 20px', marginBottom: 24 },
  navLink: { display: 'block', color: '#fff', textDecoration: 'none', padding: '10px 20px', fontSize: 14 },
  // main: { flex: 1, background: '#f5f5f5', padding: 24, overflowY: 'auto' },
  main: { flex: 1, background: '#f5f5f5', padding: 24, overflowY: 'auto', height: '100vh' },
  userBox: { marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  userName: { color: '#B5D4F4', fontSize: 13, margin: '0 0 8px' },
  logoutBtn: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', width: '100%' }
};