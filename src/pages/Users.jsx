import { useEffect, useState } from 'react';
import api from '../api';
import { Search, UserCheck, UserX, Phone, Shield, Plus, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ROLE_CONFIG = {
  retailer_admin:    { label: 'Retailer',         color: '#185FA5', bg: '#e6f1fb' },
  retailer_staff:    { label: 'Retailer Staff',   color: '#185FA5', bg: '#e6f1fb' },
  wholesaler_admin:  { label: 'Wholesaler',        color: '#1D9E75', bg: '#e1f5ee' },
  wholesaler_staff:  { label: 'Wholesaler Staff', color: '#1D9E75', bg: '#e1f5ee' },
  admin:             { label: 'Admin',             color: '#7c3aed', bg: '#ede9fe' },
  driver:            { label: 'Driver',            color: '#F2C94C', bg: '#faeeda' },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [roleFilter, setRoleFilter] = useState(location.state?.roleFilter || 'all');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', mobile: '' });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  // Update filter if navigated with state
  useEffect(() => {
    if (location.state?.roleFilter) {
      setRoleFilter(location.state.roleFilter);
    }
  }, [location.state]);

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleUser = async (userId, currentStatus) => {
    setToggling(userId);
    try {
      const res = await api.put(`/admin/users/${userId}/toggle`);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_active: res.data.user.is_active } : u));
    } catch (err) { console.error(err); }
    finally { setToggling(null); }
  };

  const createAdmin = async () => {
    if (!newAdmin.name || !newAdmin.mobile) return setAddError('Name and mobile required');
    if (newAdmin.mobile.length !== 10) return setAddError('Enter valid 10-digit mobile');
    setAddingAdmin(true); setAddError('');
    try {
      await api.post('/admin/users', { name: newAdmin.name, mobile: newAdmin.mobile });
      setShowAddAdmin(false);
      setNewAdmin({ name: '', mobile: '' });
      loadUsers();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to create admin');
    } finally { setAddingAdmin(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile?.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = ['all', 'retailer_admin', 'wholesaler_admin', 'retailer_staff', 'wholesaler_staff', 'admin', 'driver'];

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Users</h1>
          <p style={styles.pageSub}>{users.length} registered users</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setShowAddAdmin(true); setAddError(''); }}>
          <Plus size={15} /> Add Admin
        </button>
      </div>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div style={styles.modalOverlay} onClick={() => setShowAddAdmin(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Admin User</h3>
              <button style={styles.modalClose} onClick={() => setShowAddAdmin(false)}><X size={18} /></button>
            </div>
            {addError && <div style={styles.errorBox}>{addError}</div>}
            <div style={styles.modalField}>
              <label style={styles.fieldLabel}>Full Name</label>
              <input style={styles.fieldInput} placeholder="Enter name" value={newAdmin.name}
                onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={styles.modalField}>
              <label style={styles.fieldLabel}>Mobile Number</label>
              <input style={styles.fieldInput} placeholder="10-digit mobile" maxLength={10} value={newAdmin.mobile}
                onChange={e => setNewAdmin(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))} />
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              OTP login will use mobile · Default password: 123456
            </div>
            <button style={styles.submitBtn} onClick={createAdmin} disabled={addingAdmin}>
              {addingAdmin ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrap}>
          <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Search by name or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.roleFilters}>
          {roles.map(r => (
            <button
              key={r}
              style={{ ...styles.roleBtn, ...(roleFilter === r ? styles.roleBtnActive : {}) }}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'All' : ROLE_CONFIG[r]?.label || r}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['User', 'Mobile', 'Role', 'Associated With', 'Status', 'Joined', 'Action'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const rc = ROLE_CONFIG[user.role] || { label: user.role, color: '#64748b', bg: '#f1f5f9' };
                return (
                  <tr key={user.user_id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => navigate(`/users/${user.user_id}`)}>
                    <td style={styles.td}>
                      <div style={styles.userCell}>
                        <div style={{ ...styles.avatar, background: rc.bg, color: rc.color }}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.userName}>{user.name}</div>
                          <div style={styles.userId}>#{user.user_id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.mobileCell}>
                        <Phone size={13} color="#94a3b8" />
                        {user.mobile}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: rc.bg, color: rc.color }}>
                        {rc.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {(user.role === 'retailer_staff' || user.role === 'wholesaler_staff') ? (
                        user.parent_name ? (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user.parent_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{user.parent_mobile}</div>
                          </div>
                        ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(user.is_active ? styles.badgeActive : styles.badgeInactive) }}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={styles.td}>
                      {user.role !== 'admin' && (
                        <button
                          style={{ ...styles.toggleBtn, ...(user.is_active ? styles.deactivateBtn : styles.activateBtn) }}
                          onClick={(e) => { e.stopPropagation(); toggleUser(user.user_id, user.is_active); }}
                          disabled={toggling === user.user_id}
                        >
                          {toggling === user.user_id ? '...' : user.is_active ? (
                            <><UserX size={13} /> Block</>
                          ) : (
                            <><UserCheck size={13} /> Activate</>
                          )}
                        </button>
                      )}
                      {user.role === 'admin' && (
                        <span style={{ color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Shield size={13} /> Protected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={styles.empty}>No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' },
  errorBox: { background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 },
  modalField: { marginBottom: 14 },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 5 },
  fieldInput: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none' },
  submitBtn: { width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  filters: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', maxWidth: 380 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', flex: 1, background: 'transparent' },
  roleFilters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  roleBtn: { padding: '6px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' },
  roleBtnActive: { background: '#185FA5', color: '#fff', borderColor: '#185FA5' },
  tableCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' },
  td: { padding: '14px 16px', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' },
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  userId: { fontSize: 11, color: '#94a3b8', fontFamily: 'DM Mono, monospace' },
  mobileCell: { display: 'flex', alignItems: 'center', gap: 6, color: '#475569' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  badgeActive: { background: '#e1f5ee', color: '#1D9E75' },
  badgeInactive: { background: '#fee2e2', color: '#dc2626' },
  toggleBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  deactivateBtn: { background: '#fee2e2', color: '#dc2626' },
  activateBtn: { background: '#e1f5ee', color: '#1D9E75' },
  empty: { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 },
};
