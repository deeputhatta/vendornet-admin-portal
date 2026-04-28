import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, ChevronDown } from 'lucide-react';

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
  ordered:          { label: 'Ordered',    color: '#185FA5', bg: '#e6f1fb' },
};

const ALLOWED_STATUSES = ['pending', 'accepted', 'packing', 'dispatched', 'delivered', 'completed', 'rejected'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = () => {
    api.get(`/admin/orders/${id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const updateStatus = async (subOrderId, status) => {
    setUpdating(subOrderId);
    setOpenDropdown(null);
    try {
      const res = await api.put(`/admin/orders/${subOrderId}/status`, { status });
      // Update local state
      setData(prev => ({
        ...prev,
        order: { ...prev.order, overall_status: res.data.overall_status },
        sub_orders: prev.sub_orders.map(s =>
          s.sub_order_id === subOrderId ? { ...s, status } : s
        ),
      }));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Loader />;
  if (!data) return <div style={{ padding: 32, color: '#94a3b8' }}>Order not found</div>;

  const { order, sub_orders } = data;
  const oc = STATUS_CONFIG[order.overall_status] || { label: order.overall_status, color: '#64748b', bg: '#f1f5f9' };

  return (
    <div className="fade-in" onClick={() => setOpenDropdown(null)}>
      <button style={styles.backBtn} onClick={() => navigate('/orders')}>
        <ArrowLeft size={16} /> Back to Orders
      </button>

      {/* Order header */}
      <div style={styles.headerCard}>
        <div>
          <div style={styles.orderId}>#{order.order_id.slice(0, 8).toUpperCase()}</div>
          <div style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={styles.orderAmount}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ ...styles.badge, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12 }}>
              {oc.label}
            </span>
          </div>
          <div style={styles.orderMeta}>{sub_orders.length} supplier{sub_orders.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Retailer info */}
      <div style={styles.retailerCard}>
        <div style={styles.retailerAvatar}>{order.retailer_name?.charAt(0)}</div>
        <div>
          <div style={styles.retailerName}>{order.retailer_name}</div>
          <div style={styles.retailerMeta}>{order.retailer_mobile}</div>
          {order.retailer_address && <div style={styles.retailerMeta}>{order.retailer_address}</div>}
        </div>
        <div style={styles.retailerLabel}>Retailer</div>
      </div>

      {/* Sub orders */}
      {sub_orders.map((sub) => {
        const sc = STATUS_CONFIG[sub.status] || { label: sub.status, color: '#64748b', bg: '#f1f5f9' };
        const isUpdating = updating === sub.sub_order_id;
        const isOpen = openDropdown === sub.sub_order_id;

        return (
          <div key={sub.sub_order_id} style={styles.subCard}>
            {/* Wholesaler header */}
            <div style={styles.subHeader}>
              <div style={styles.wsAvatar}>{sub.wholesaler_name?.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.wsName}>{sub.wholesaler_name}</div>
                <div style={styles.wsMobile}>{sub.wholesaler_mobile}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.subAmount}>₹{parseFloat(sub.total_amount).toLocaleString('en-IN')}</div>
                </div>
                {/* Status Dropdown */}
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : sub.sub_order_id)}
                    disabled={isUpdating}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: sc.bg, color: sc.color,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {isUpdating ? 'Updating...' : sc.label}
                    <ChevronDown size={13} />
                  </button>
                  {isOpen && (
                    <div style={styles.dropdown}>
                      <div style={styles.dropdownTitle}>Update Status</div>
                      {ALLOWED_STATUSES.map(s => {
                        const sc2 = STATUS_CONFIG[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(sub.sub_order_id, s)}
                            style={{
                              ...styles.dropdownItem,
                              background: sub.status === s ? sc2.bg : 'transparent',
                              color: sub.status === s ? sc2.color : '#334155',
                              fontWeight: sub.status === s ? 700 : 400,
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc2.color, display: 'inline-block', flexShrink: 0 }} />
                            {sc2.label}
                            {sub.status === s && ' ✓'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Product', 'Brand', 'Pack', 'Qty', 'Unit Price', 'Total', 'Status'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sub.items?.map(item => {
                  const ic = STATUS_CONFIG[item.status] || { label: item.status, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <tr key={item.item_id} style={styles.tr}>
                      <td style={styles.td}><strong>{item.generic_name}</strong></td>
                      <td style={styles.td}>{item.brand_name}</td>
                      <td style={styles.td}>{item.attributes?.pack_size || item.attributes?.size || '—'}</td>
                      <td style={styles.td}>{item.quantity}</td>
                      <td style={styles.td}>₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                      <td style={styles.td}><strong style={{ color: '#185FA5' }}>₹{parseFloat(item.item_total).toLocaleString('en-IN')}</strong></td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: ic.bg, color: ic.color, fontSize: 10 }}>{ic.label}</span>
                        {item.rejection_reason && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.rejection_reason}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Sub order meta */}
            <div style={styles.subMeta}>
              {sub.pod_confirmed_at && <span style={styles.metaTag}>✓ POD confirmed</span>}
              {sub.invoice_uploaded_at && <span style={styles.metaTag}>✓ Invoice uploaded</span>}
              {sub.auto_cancel_at && <span style={{ ...styles.metaTag, color: '#ea580c' }}>Auto-cancel: {new Date(sub.auto_cancel_at).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
        );
      })}

      {/* Order total */}
      <div style={styles.totalCard}>
        <span style={styles.totalLabel}>Order Total</span>
        <span style={styles.totalValue}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
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
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 },
  headerCard: { background: '#185FA5', borderRadius: 14, padding: '20px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'DM Mono, monospace', marginBottom: 4 },
  orderDate: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  orderAmount: { fontSize: 28, fontWeight: 800, color: '#fff' },
  orderMeta: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  retailerCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 },
  retailerAvatar: { width: 40, height: 40, borderRadius: '50%', background: '#e6f1fb', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  retailerName: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  retailerMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  retailerLabel: { marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#185FA5', background: '#e6f1fb', padding: '3px 10px', borderRadius: 20 },
  subCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 14, overflow: 'visible' },
  subHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  wsAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#e1f5ee', color: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  wsName: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  wsMobile: { fontSize: 12, color: '#64748b' },
  subAmount: { fontSize: 14, fontWeight: 700, color: '#185FA5' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  dropdown: {
    position: 'absolute', right: 0, top: '110%', zIndex: 300,
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
  },
  dropdownTitle: { padding: '10px 14px 6px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  dropdownItem: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '9px 14px', border: 'none', cursor: 'pointer',
    fontSize: 13, textAlign: 'left',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '12px 16px', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' },
  subMeta: { display: 'flex', gap: 10, padding: '12px 20px', flexWrap: 'wrap' },
  metaTag: { fontSize: 12, color: '#1D9E75', background: '#e1f5ee', padding: '3px 10px', borderRadius: 20 },
  totalCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: 600, color: '#64748b' },
  totalValue: { fontSize: 24, fontWeight: 800, color: '#185FA5' },
};
