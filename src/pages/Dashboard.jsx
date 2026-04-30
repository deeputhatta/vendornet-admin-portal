import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../api';
import { Users, ShoppingBag, TrendingUp, DollarSign, Package, Store } from 'lucide-react';

const STATUS_COLORS = {
  pending: '#F2C94C', accepted: '#1D9E75', packing: '#0A84FF',
  dispatched: '#F2C94C', delivered: '#30D158', completed: '#30D158',
  invoice_uploaded: '#30D158', rejected: '#FF453A', auto_cancelled: '#FF9500',
};

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  packing: 'Packing',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  completed: 'Completed',
  invoice_uploaded: 'Invoice Uploaded',
  rejected: 'Rejected',
  auto_cancelled: 'Auto Cancelled',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/orders'),
      api.get('/admin/commission'),
    ]).then(([usersRes, ordersRes, commRes]) => {
      const users = usersRes.data.users;
      const orders = ordersRes.data.orders;
      const commission = commRes.data;

      const retailers = users.filter(u => u.role.includes('retailer'));
      const wholesalers = users.filter(u => u.role.includes('wholesaler'));
      const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

      const statusCount = {};
      orders.forEach(o => {
        statusCount[o.overall_status || 'pending'] = (statusCount[o.overall_status || 'pending'] || 0) + 1;
      });
      const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

      const dayMap = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        dayMap[key] = 0;
      }
      orders.forEach(o => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (dayMap[key] !== undefined) dayMap[key]++;
      });
      const dailyData = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

      setData({ users, retailers, wholesalers, orders, totalRevenue, commission, statusData, dailyData });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const stats = [
    { label: 'Total Users',  value: data.users.length,                                                              icon: Users,      color: '#185FA5', bg: '#e6f1fb', route: '/users' },
    { label: 'Retailers',    value: data.retailers.length,                                                           icon: Store,      color: '#1D9E75', bg: '#e1f5ee', route: '/users', state: { roleFilter: 'retailer_admin' } },
    { label: 'Wholesalers',  value: data.wholesalers.length,                                                         icon: Package,    color: '#F2C94C', bg: '#faeeda', route: '/users', state: { roleFilter: 'wholesaler_admin' } },
    { label: 'Total Orders', value: data.orders.length,                                                              icon: ShoppingBag,color: '#185FA5', bg: '#e6f1fb', route: '/orders' },
    { label: 'Revenue',      value: `₹${(data.totalRevenue/1000).toFixed(1)}K`,                                     icon: TrendingUp, color: '#1D9E75', bg: '#e1f5ee', route: '/analytics' },
    { label: 'Commission',   value: `₹${parseFloat(data.commission.total_commission).toLocaleString('en-IN')}`,     icon: DollarSign, color: '#F2C94C', bg: '#faeeda', route: '/commission' },
  ];

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Dashboard</h1>
        <p style={styles.pageSub}>VendorNet platform overview</p>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} style={styles.statCard} onClick={() => navigate(s.route, { state: s.state || {} })}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,95,165,0.12)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
          >
            <div style={{ ...styles.statIcon, background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Orders — last 7 days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailyData} barSize={28}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13 }} />
              <Bar dataKey="count" name="Orders" fill="#185FA5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Orders by status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.statusData} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={150} tickFormatter={v => STATUS_LABELS[v] || v} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13 }} />
              <Bar dataKey="value" name="Orders" radius={[0, 6, 6, 0]}>
                {data.statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || '#185FA5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders */}
      <div style={styles.tableCard}>
        <h3 style={styles.chartTitle}>Recent orders</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Order ID', 'Retailer', 'Mobile', 'Amount', 'Date'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.orders.slice(0, 8).map(o => (
                <tr key={o.order_id} style={{ ...styles.tr, cursor: 'pointer' }}
                  onClick={() => navigate(`/orders/${o.order_id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={styles.td}><span style={styles.orderId}>#{o.order_id.slice(0,8).toUpperCase()}</span></td>
                  <td style={styles.td}>{o.retailer_name}</td>
                  <td style={styles.td}>{o.retailer_mobile}</td>
                  <td style={styles.td}><strong style={{ color: '#185FA5' }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</strong></td>
                  <td style={styles.td}>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 14, padding: '18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  statIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  chartCard: { background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  chartTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 16 },
  tableCard: { background: '#fff', borderRadius: 14, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 12px', fontSize: 13, color: '#334155' },
  orderId: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b' },
};
