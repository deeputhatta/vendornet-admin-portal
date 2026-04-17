import { useEffect, useState } from 'react';
import api from '../api';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  pending:          { label: 'Pending',    color: '#b45309', bg: '#fef3c7' },
  accepted:         { label: 'Accepted',   color: '#1D9E75', bg: '#e1f5ee' },
  packing:          { label: 'Packing',    color: '#185FA5', bg: '#e6f1fb' },
  dispatched:       { label: 'Dispatched', color: '#b45309', bg: '#fef3c7' },
  delivered:        { label: 'Delivered',  color: '#15803d', bg: '#dcfce7' },
  completed:        { label: 'Completed',  color: '#15803d', bg: '#dcfce7' },
  invoice_uploaded: { label: 'Invoiced',   color: '#15803d', bg: '#dcfce7' },
  rejected:         { label: 'Rejected',   color: '#dc2626', bg: '#fee2e2' },
  auto_cancelled:   { label: 'Cancelled',  color: '#ea580c', bg: '#fff7ed' },
};

const STATUSES = ['all', 'pending', 'accepted', 'packing', 'dispatched', 'delivered', 'completed', 'rejected', 'auto_cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/orders').then(res => setOrders(res.data.orders))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = o.retailer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.retailer_mobile?.includes(search) ||
      o.order_id?.includes(search);
    const matchStatus = statusFilter === 'all' || (o.overall_status || 'pending') === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Orders</h1>
          <p style={styles.pageSub}>{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrap}>
          <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Search by retailer, mobile or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.statusFilters}>
          {STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                style={{
                  ...styles.statusBtn,
                  ...(statusFilter === s ? {
                    background: s === 'all' ? '#185FA5' : cfg?.bg,
                    color: s === 'all' ? '#fff' : cfg?.color,
                    borderColor: s === 'all' ? '#185FA5' : cfg?.color,
                  } : {})
                }}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : cfg?.label || s}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Order ID', 'Retailer', 'Mobile', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const status = o.overall_status || 'pending';
                const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
                return (
                  <tr key={o.order_id} style={{ ...styles.tr, cursor: 'pointer' }} onClick={() => navigate(`/orders/${o.order_id}`)}>
                    <td style={styles.td}>
                      <span style={styles.orderId}>#{o.order_id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td style={styles.td}><strong>{o.retailer_name}</strong></td>
                    <td style={styles.td}>{o.retailer_mobile}</td>
                    <td style={styles.td}>
                      <strong style={{ color: '#185FA5' }}>
                        ₹{parseFloat(o.total_amount).toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(o.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={styles.empty}>No orders found</div>
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
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  filters: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', maxWidth: 420 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', flex: 1, background: 'transparent' },
  statusFilters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  statusBtn: { padding: '5px 12px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' },
  tableCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' },
  orderId: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b', background: '#f8fafc', padding: '3px 8px', borderRadius: 6 },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  empty: { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 },
};
