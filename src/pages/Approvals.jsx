import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { CheckCircle, XCircle, Package, Tag } from 'lucide-react';

export default function Approvals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [tab, setTab] = useState('variants');
  const navigate = useNavigate();

  useEffect(() => { loadApprovals(); }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/approvals');
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const approveVariant = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/admin/variants/${id}/approve`);
      await loadApprovals();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setProcessing(null); }
  };

  const rejectVariant = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    setProcessing(id);
    try {
      await api.put(`/admin/variants/${id}/reject`, { reason: reason || 'Rejected by admin' });
      await loadApprovals();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setProcessing(null); }
  };

  if (loading) return <Loader />;

  const variantCount = data?.variants?.length || 0;
  const productCount = data?.products?.length || 0;
  const totalPending = variantCount + productCount;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Approvals</h1>
          <p style={styles.pageSub}>
            {totalPending === 0
              ? <span style={{ color: '#1D9E75' }}>All caught up — no pending approvals</span>
              : <span style={{ color: '#b45309' }}>{totalPending} pending approval{totalPending > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={loadApprovals}>↻ Refresh</button>
      </div>

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'variants' ? styles.tabActive : {}) }} onClick={() => setTab('variants')}>
          <Tag size={13} /> Variant Requests
          {variantCount > 0 && <span style={styles.tabBadge}>{variantCount}</span>}
        </button>
        <button style={{ ...styles.tab, ...(tab === 'products' ? styles.tabActive : {}) }} onClick={() => setTab('products')}>
          <Package size={13} /> Product Requests
          {productCount > 0 && <span style={styles.tabBadge}>{productCount}</span>}
        </button>
      </div>

      {tab === 'variants' && (
        <div>
          {variantCount === 0 ? <Empty message="No pending variant requests" /> : (
            data.variants.map(v => (
              <div key={v.variant_id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.productName}>{v.generic_name}</div>
                    <div style={styles.categoryBadge}>{v.category_name}</div>
                  </div>
                  <div style={styles.hsnBadge}>HSN: {v.hsn_code || <span style={{ color: '#dc2626' }}>Missing</span>}</div>
                </div>
                <div style={styles.variantRow}>
                  <div style={styles.brandWrap}>
                    <div style={styles.brandName}>{v.brand_name}</div>
                    {v.manufacturer && <div style={styles.manufacturer}>{v.manufacturer}</div>}
                  </div>
                  {v.attributes && Object.keys(v.attributes).length > 0 && (
                    <div style={styles.attrGrid}>
                      {Object.entries(v.attributes).map(([k, val]) => (
                        <div key={k} style={styles.attrItem}>
                          <span style={styles.attrKey}>{k.replace(/_/g, ' ')}</span>
                          <span style={styles.attrVal}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={styles.requestedBy}>
                  Requested by <strong>{v.requested_by_name}</strong> · {v.requested_by_mobile} ·{' '}
                  {new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={styles.actions}>
                  <button style={styles.viewBtn} onClick={() => navigate(`/products/${v.product_id}`)}>View Product →</button>
                  <button style={styles.rejectBtn} onClick={() => rejectVariant(v.variant_id)} disabled={processing === v.variant_id}>
                    <XCircle size={14} /> {processing === v.variant_id ? '...' : 'Reject'}
                  </button>
                  <button style={styles.approveBtn} onClick={() => approveVariant(v.variant_id)} disabled={processing === v.variant_id}>
                    <CheckCircle size={14} /> {processing === v.variant_id ? '...' : 'Approve'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'products' && (
        <div>
          {productCount === 0 ? <Empty message="No pending product requests" /> : (
            data.products.map(p => (
              <div key={p.product_id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.productName}>{p.generic_name}</div>
                    <div style={styles.categoryBadge}>{p.category_name}</div>
                  </div>
                  <div style={styles.hsnBadge}>HSN: {p.hsn_code || <span style={{ color: '#dc2626' }}>Missing!</span>}</div>
                </div>
                <div style={styles.requestedBy}>
                  Requested by <strong>{p.requested_by_name}</strong> · {p.requested_by_mobile} ·{' '}
                  {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                  ℹ Approving this product will also approve its associated variant request
                </div>
                <div style={styles.actions}>
                  <div style={{ flex: 1 }} />
                  <button style={styles.rejectBtn} onClick={() => rejectVariant(p.product_id)} disabled={processing === p.product_id}>
                    <XCircle size={14} /> Reject Product
                  </button>
                  <button style={styles.approveBtn} onClick={() => approveVariant(p.product_id)} disabled={processing === p.product_id}>
                    <CheckCircle size={14} /> {processing === p.product_id ? '...' : 'Approve Product'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
      <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
      <div style={{ fontSize: 14 }}>{message}</div>
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
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, marginTop: 2 },
  refreshBtn: { padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, cursor: 'pointer', color: '#64748b' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  tabActive: { background: '#185FA5', color: '#fff', borderColor: '#185FA5' },
  tabBadge: { background: '#FF453A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, marginLeft: 2 },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productName: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  categoryBadge: { display: 'inline-block', background: '#e6f1fb', color: '#185FA5', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 },
  hsnBadge: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#475569', fontFamily: 'monospace' },
  variantRow: { display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12, padding: '12px', background: '#f8fafc', borderRadius: 10 },
  brandWrap: { minWidth: 140 },
  brandName: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  manufacturer: { fontSize: 12, color: '#64748b', marginTop: 2 },
  attrGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 },
  attrItem: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px', minWidth: 80 },
  attrKey: { display: 'block', fontSize: 9, color: '#94a3b8', textTransform: 'capitalize', marginBottom: 1 },
  attrVal: { fontSize: 12, fontWeight: 600, color: '#0f172a' },
  requestedBy: { fontSize: 12, color: '#94a3b8', marginBottom: 14 },
  actions: { display: 'flex', gap: 10, alignItems: 'center' },
  viewBtn: { flex: 1, padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#185FA5', fontWeight: 600, cursor: 'pointer' },
  rejectBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: '#fee2e2', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer' },
  approveBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 16px', background: '#185FA5', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' },
};
