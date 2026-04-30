import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, Users, ShoppingBag, CheckSquare,
  FlaskConical, Package, Tag, Activity,
  DollarSign, TrendingUp, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users',         icon: Users,           label: 'Users' },
  { to: '/orders',        icon: ShoppingBag,     label: 'Orders' },
  { to: '/approvals',     icon: CheckSquare,     label: 'Approvals' },
  { to: '/products',      icon: FlaskConical,    label: 'Products' },
  { to: '/listings',      icon: Package,         label: 'Listings' },
  { to: '/categories',    icon: Tag,             label: 'Categories' },
  { to: '/activity-logs', icon: Activity,    label: 'Activity Logs' },
  { to: '/analytics',     icon: TrendingUp,  label: 'Analytics' },
  { to: '/commission',    icon: DollarSign,  label: 'Commission' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.root}>
      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}

      <aside style={{ ...styles.sidebar, left: open ? 0 : undefined }}>
        <div style={styles.logo}>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="16" fill="#185FA5"/>
            <circle cx="7" cy="12" r="2.5" fill="#1D9E75"/>
            <circle cx="16" cy="5" r="2" fill="#F2C94C"/>
            <circle cx="25" cy="12" r="2.5" fill="#1D9E75"/>
            <circle cx="27" cy="19" r="2" fill="#F2C94C"/>
            <circle cx="20" cy="27" r="2" fill="#1D9E75"/>
            <circle cx="12" cy="27" r="2" fill="#F2C94C"/>
            <circle cx="5" cy="20" r="2" fill="#1D9E75"/>
            {[[[7,12],[16,16]],[[16,5],[16,16]],[[25,12],[16,16]],[[27,19],[16,16]],[[20,27],[16,16]],[[12,27],[16,16]],[[5,20],[16,16]]].map(([[x1,y1],[x2,y2]],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            ))}
            <circle cx="16" cy="16" r="4" fill="white" opacity="0.2"/>
            <circle cx="16" cy="16" r="2.5" fill="white"/>
            <circle cx="16" cy="16" r="1.2" fill="#185FA5"/>
          </svg>
          <div>
            <div style={styles.logoText}>VendorNet</div>
            <div style={styles.logoSub}>Admin</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                ...styles.navItem,
                background: isActive ? 'rgba(24,95,165,0.1)' : 'transparent',
                color: isActive ? '#185FA5' : '#475569',
                fontWeight: isActive ? 600 : 400,
              })}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.userBox}>
          <div style={styles.avatar}>{user?.name?.charAt(0)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>Administrator</div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div style={styles.main}>
        <div style={styles.mobileHeader}>
          <button style={styles.menuBtn} onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <span style={styles.mobileTitle}>VendorNet Admin</span>
        </div>
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

const styles = {
  root: { display: 'flex', minHeight: '100vh' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 },
  sidebar: {
    width: 240, background: '#fff', borderRight: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', position: 'fixed',
    top: 0, bottom: 0, left: 0, zIndex: 100, transition: 'left 0.25s ease',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 20px', borderBottom: '1px solid #e2e8f0',
  },
  logoText: { fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 },
  logoSub: { fontSize: 11, color: '#185FA5', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },
  nav: { flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 10, fontSize: 14,
    transition: 'all 0.15s', textDecoration: 'none',
  },
  userBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 16px', borderTop: '1px solid #e2e8f0',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: '#185FA5', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: '#94a3b8' },
  logoutBtn: {
    background: 'none', border: 'none', color: '#94a3b8',
    cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
  },
  main: { marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  mobileHeader: {
    display: 'none', alignItems: 'center', gap: 12,
    padding: '14px 16px', background: '#fff',
    borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50,
  },
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#0f172a' },
  mobileTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  content: { padding: '28px', flex: 1 },
};
