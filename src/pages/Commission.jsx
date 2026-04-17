import { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign } from 'lucide-react';

export default function Commission() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/commission').then(res => setData(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Commission Ledger</h1>
          <p style={styles.pageSub}>Platform commission from wholesaler invoices</p>
        </div>
        <div style={styles.totalCard}>
          <div style={styles.totalIcon}><DollarSign size={20} color="#1D9E75" /></div>
          <div>
            <div style={styles.totalLabel}>Total Commission</div>
            <div style={styles.totalValue}>₹{parseFloat(data.total_commission).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Invoice', 'Wholesaler', 'Commission', 'Date'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ledger.map(row => (
                <tr key={row.ledger_id || row.invoice_id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.invoiceId}>{row.invoice_number}</span>
                  </td>
                  <td style={styles.td}><strong>{row.wholesaler_name}</strong></td>
                  <td style={styles.td}>
                    <strong style={{ color: '#1D9E75' }}>
                      ₹{parseFloat(row.commission_amount).toLocaleString('en-IN')}
                    </strong>
                  </td>
                  <td style={styles.td}>
                    {new Date(row.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.ledger.length === 0 && (
            <div style={styles.empty}>No commission records yet</div>
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  totalCard: { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  totalIcon: { width: 44, height: 44, borderRadius: 12, background: '#e1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontSize: 12, color: '#64748b' },
  totalValue: { fontSize: 22, fontWeight: 700, color: '#1D9E75' },
  tableCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: 13, color: '#334155' },
  invoiceId: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b', background: '#f8fafc', padding: '3px 8px', borderRadius: 6 },
  empty: { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 },
};
