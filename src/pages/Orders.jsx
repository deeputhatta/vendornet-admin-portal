import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';

const STATUS_COLORS = {
  pending: { bg: '#FAEEDA', text: '#633806' },
  accepted: { bg: '#EAF3DE', text: '#27500A' },
  dispatched: { bg: '#E6F1FB', text: '#0C447C' },
  delivered: { bg: '#EAF3DE', text: '#27500A' },
  invoice_uploaded: { bg: '#EAF3DE', text: '#27500A' },
  completed: { bg: '#EAF3DE', text: '#27500A' },
  rejected: { bg: '#FCEBEB', text: '#791F1F' },
  auto_cancelled: { bg: '#FCEBEB', text: '#791F1F' }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [commission, setCommission] = useState({ ledger: [], total: 0 });
  const [tab, setTab] = useState('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ordersRes, commRes] = await Promise.all([
        ordersAPI.getAll(),
        ordersAPI.getCommission()
      ]);
      setOrders(ordersRes.data.orders);
      setCommission({
        ledger: commRes.data.ledger,
        total: commRes.data.total_commission
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Orders & Commission</h2>
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, background: tab === 'orders' ? '#185FA5' : '#fff', color: tab === 'orders' ? '#fff' : '#333' }}
            onClick={() => setTab('orders')}>Orders ({orders.length})</button>
          <button style={{ ...styles.tab, background: tab === 'commission' ? '#185FA5' : '#fff', color: tab === 'commission' ? '#fff' : '#333' }}
            onClick={() => setTab('commission')}>Commission (₹{commission.total})</button>
        </div>
      </div>

      {tab === 'orders' && (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span style={{ flex: 2 }}>Order ID</span>
            <span style={{ flex: 2 }}>Retailer</span>
            <span style={{ flex: 1 }}>Amount</span>
            <span style={{ flex: 1 }}>Date</span>
          </div>
          {orders.map(o => (
            <div key={o.order_id} style={styles.tableRow}>
              <span style={{ flex: 2, fontFamily: 'monospace', fontSize: 13 }}>
                {o.order_id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{ flex: 2 }}>
                <div style={{ fontWeight: 500 }}>{o.retailer_name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{o.retailer_mobile}</div>
              </span>
              <span style={{ flex: 1, fontWeight: 600, color: '#185FA5' }}>
                ₹{parseFloat(o.total_amount).toLocaleString('en-IN')}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: '#888' }}>
                {new Date(o.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'commission' && (
        <>
          <div style={styles.commissionTotal}>
            <p style={styles.commissionLabel}>Total Commission Accrued</p>
            <p style={styles.commissionAmount}>₹{parseFloat(commission.total).toLocaleString('en-IN')}</p>
          </div>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={{ flex: 2 }}>Invoice</span>
              <span style={{ flex: 2 }}>Wholesaler</span>
              <span style={{ flex: 1 }}>Rate</span>
              <span style={{ flex: 1 }}>Commission</span>
              <span style={{ flex: 1 }}>Source</span>
              <span style={{ flex: 1 }}>Status</span>
            </div>
            {commission.ledger.map(l => (
              <div key={l.ledger_id} style={styles.tableRow}>
                <span style={{ flex: 2, fontSize: 13 }}>{l.invoice_number}</span>
                <span style={{ flex: 2 }}>{l.wholesaler_name}</span>
                <span style={{ flex: 1 }}>{l.rate_pct}%</span>
                <span style={{ flex: 1, fontWeight: 600, color: '#0F6E56' }}>
                  ₹{parseFloat(l.commission_amount).toLocaleString('en-IN')}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ background: '#E6F1FB', color: '#0C447C', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {l.rate_source}
                  </span>
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ background: '#EAF3DE', color: '#27500A', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    {l.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 600, color: '#333', margin: 0 },
  tabs: { display: 'flex', gap: 6 },
  tab: { border: '1px solid #ddd', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tableHeader: { display: 'flex', padding: '12px 16px', background: '#f9f9f9', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #eee' },
  tableRow: { display: 'flex', padding: '14px 16px', borderBottom: '1px solid #f0f0f0', alignItems: 'center', fontSize: 14 },
  commissionTotal: { background: '#0F6E56', borderRadius: 12, padding: 20, marginBottom: 16, display: 'inline-block', minWidth: 240 },
  commissionLabel: { color: '#9FE1CB', fontSize: 13, margin: '0 0 4px' },
  commissionAmount: { color: '#fff', fontSize: 32, fontWeight: 700, margin: 0 }
};