import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0, orders: 0, wholesalers: 0, retailers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/orders')
      ]);
      const users = usersRes.data.users || [];
      setStats({
        users: users.length,
        wholesalers: users.filter(u => u.role === 'wholesaler').length,
        retailers: users.filter(u => u.role === 'retailer').length,
        orders: ordersRes.data.orders?.length || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={styles.title}>Dashboard</h2>
      {loading ? <p>Loading...</p> : (
        <div style={styles.grid}>
          <StatCard label="Total Users" value={stats.users} color="#185FA5" />
          <StatCard label="Wholesalers" value={stats.wholesalers} color="#0F6E56" />
          <StatCard label="Retailers" value={stats.retailers} color="#854F0B" />
          <StatCard label="Total Orders" value={stats.orders} color="#533AB7" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
    </div>
  );
}

const styles = {
  title: { fontSize: 22, fontWeight: 600, color: '#333', marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardLabel: { fontSize: 13, color: '#888', margin: '0 0 8px' },
  cardValue: { fontSize: 36, fontWeight: 700, margin: 0 }
};