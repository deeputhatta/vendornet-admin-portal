import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

const ROLE_COLORS = {
  admin: { bg: '#E6F1FB', text: '#0C447C' },
  wholesaler: { bg: '#EAF3DE', text: '#27500A' },
  retailer: { bg: '#FAEEDA', text: '#633806' },
  driver: { bg: '#F1EFE8', text: '#444441' }
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (id) => {
    try {
      await usersAPI.toggleActive(id);
      loadUsers();
    } catch (err) {
      alert('Failed to update user');
    }
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Users ({filtered.length})</h2>
        <div style={styles.filters}>
          {['all', 'retailer', 'wholesaler', 'driver', 'admin'].map(role => (
            <button
              key={role}
              style={{ ...styles.filterBtn, background: filter === role ? '#185FA5' : '#fff', color: filter === role ? '#fff' : '#333' }}
              onClick={() => setFilter(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={{ flex: 2 }}>Name</span>
          <span style={{ flex: 2 }}>Mobile</span>
          <span style={{ flex: 1 }}>Role</span>
          <span style={{ flex: 2 }}>GSTIN</span>
          <span style={{ flex: 1 }}>Status</span>
          <span style={{ flex: 1 }}>Action</span>
        </div>
        {filtered.map(user => (
          <div key={user.user_id} style={styles.tableRow}>
            <span style={{ flex: 2, fontWeight: 500 }}>{user.name}</span>
            <span style={{ flex: 2, color: '#666' }}>{user.mobile}</span>
            <span style={{ flex: 1 }}>
              <span style={{
                background: ROLE_COLORS[user.role]?.bg,
                color: ROLE_COLORS[user.role]?.text,
                padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600
              }}>
                {user.role}
              </span>
            </span>
            <span style={{ flex: 2, color: '#666', fontSize: 13 }}>{user.gstin || '—'}</span>
            <span style={{ flex: 1 }}>
              <span style={{
                background: user.is_active ? '#EAF3DE' : '#FCEBEB',
                color: user.is_active ? '#27500A' : '#791F1F',
                padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600
              }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </span>
            <span style={{ flex: 1 }}>
              <button
                style={{ ...styles.toggleBtn, background: user.is_active ? '#FCEBEB' : '#EAF3DE', color: user.is_active ? '#791F1F' : '#27500A' }}
                onClick={() => toggleUser(user.user_id)}
              >
                {user.is_active ? 'Disable' : 'Enable'}
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 22, fontWeight: 600, color: '#333', margin: 0 },
  filters: { display: 'flex', gap: 6 },
  filterBtn: { border: '1px solid #ddd', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tableHeader: { display: 'flex', padding: '12px 16px', background: '#f9f9f9', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #eee' },
  tableRow: { display: 'flex', padding: '14px 16px', borderBottom: '1px solid #f0f0f0', alignItems: 'center', fontSize: 14 },
  toggleBtn: { border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }
};