import { useEffect, useState } from 'react';
import api from '../api';
import { Search, Package } from 'lucide-react';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toggling, setToggling] = useState(null);

  useEffect(() => { loadListings(); }, []);

  const loadListings = async () => {
    try {
      const res = await api.get('/admin/listings');
      setListings(res.data.listings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleListing = async (id, e) => {
    e.stopPropagation();
    setToggling(id);
    try {
      const res = await api.put(`/admin/listings/${id}/toggle`);
      setListings(prev => prev.map(l => l.listing_id === id ? { ...l, is_active: res.data.listing.is_active } : l));
    } catch (err) { console.error(err); }
    finally { setToggling(null); }
  };

  const filtered = listings.filter(l => {
    const matchSearch = l.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.wholesaler_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' ? l.is_active : !l.is_active);
    return matchSearch && matchFilter;
  });

  if (loading) return <Loader />;

  const activeCount = listings.filter(l => l.is_active).length;
  const inactiveCount = listings.filter(l => !l.is_active).length;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Listings</h1>
          <p style={styles.pageSub}>{listings.length} total listings · {activeCount} active · {inactiveCount} inactive</p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrap}>
          <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="Search product, brand or wholesaler..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.tabFilters}>
          {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([key, label]) => (
            <button
              key={key}
              style={{ ...styles.tabBtn, ...(filter === key ? styles.tabBtnActive : {}) }}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Product', 'Brand', 'Pack', 'Wholesaler', 'Price', 'Offer', 'Stock', 'MOQ', 'Status', 'Action'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.listing_id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={styles.productIcon}><Package size={14} color="#185FA5" /></div>
                      <strong style={{ color: '#0f172a' }}>{l.generic_name}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>{l.brand_name}</td>
                  <td style={styles.td}>{l.attributes?.pack_size || l.attributes?.size || '—'}</td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{l.wholesaler_name}</div>
                  </td>
                  <td style={styles.td}>₹{parseFloat(l.price).toLocaleString('en-IN')}</td>
                  <td style={styles.td}>
                    {l.offer_price ? (
                      <span style={{ color: '#1D9E75', fontWeight: 600 }}>₹{parseFloat(l.offer_price).toLocaleString('en-IN')}</span>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ color: l.stock_qty < 10 ? '#dc2626' : '#0f172a', fontWeight: l.stock_qty < 10 ? 600 : 400 }}>
                      {l.stock_qty}
                    </span>
                  </td>
                  <td style={styles.td}>{l.min_order_qty}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(l.is_active ? styles.badgeActive : styles.badgeInactive) }}>
                      {l.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.toggleBtn, ...(l.is_active ? styles.deactivateBtn : styles.activateBtn) }}
                      onClick={(e) => toggleListing(l.listing_id, e)}
                      disabled={toggling === l.listing_id}
                    >
                      {toggling === l.listing_id ? '...' : l.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={styles.empty}>No listings found</div>
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
  tabFilters: { display: 'flex', gap: 8 },
  tabBtn: { padding: '6px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  tabBtnActive: { background: '#185FA5', color: '#fff', borderColor: '#185FA5' },
  tableCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '13px 16px', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' },
  productIcon: { width: 28, height: 28, borderRadius: 8, background: '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  badgeActive: { background: '#e1f5ee', color: '#1D9E75' },
  badgeInactive: { background: '#fee2e2', color: '#dc2626' },
  toggleBtn: { padding: '5px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  deactivateBtn: { background: '#fee2e2', color: '#dc2626' },
  activateBtn: { background: '#e1f5ee', color: '#1D9E75' },
  empty: { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 },
};
