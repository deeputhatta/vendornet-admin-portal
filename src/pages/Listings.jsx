import { useEffect, useState } from 'react';
import api from '../api';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 200;

export default function Listings() {
  const [wholesalers, setWholesalers] = useState([]);
  const [selectedWholesaler, setSelectedWholesaler] = useState(null);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingWholesalers, setLoadingWholesalers] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toggling, setToggling] = useState(null);

  useEffect(() => { loadWholesalers(); }, []);

  // Debounced backend search — reset to page 1
  useEffect(() => {
    if (!selectedWholesaler) return;
    const timer = setTimeout(() => {
      setOffset(0);
      loadListings(selectedWholesaler.user_id, search, 0);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadWholesalers = async () => {
    try {
      const res = await api.get('/admin/users');
      const ws = res.data.users.filter(u => u.role === 'wholesaler_admin');
      setWholesalers(ws);
    } catch (err) { console.error(err); }
    finally { setLoadingWholesalers(false); }
  };

  const loadListings = async (wholesalerId, searchTerm = '', off = 0) => {
    setLoading(true);
    setListings([]);
    try {
      const params = new URLSearchParams({ wholesaler_id: wholesalerId, offset: off });
      if (searchTerm) params.append('search', searchTerm);
      const res = await api.get(`/admin/listings?${params}`);
      setListings(res.data.listings || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const selectWholesaler = (ws) => {
    setSelectedWholesaler(ws);
    setSearch('');
    setFilter('all');
    setOffset(0);
    loadListings(ws.user_id, '', 0);
  };

  const goNext = () => {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    loadListings(selectedWholesaler.user_id, search, newOffset);
  };

  const goPrev = () => {
    const newOffset = Math.max(0, offset - PAGE_SIZE);
    setOffset(newOffset);
    loadListings(selectedWholesaler.user_id, search, newOffset);
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

  const filtered = listings.filter(l =>
    filter === 'all' || (filter === 'active' ? l.is_active : !l.is_active)
  );

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  if (loadingWholesalers) return <Loader />;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Listings</h1>
          <p style={styles.pageSub}>Select a wholesaler to view their listings</p>
        </div>
      </div>

      {/* Wholesaler Selector */}
      <div style={styles.wholesalerGrid}>
        {wholesalers.map(ws => (
          <div
            key={ws.user_id}
            onClick={() => selectWholesaler(ws)}
            style={{
              ...styles.wholesalerCard,
              border: selectedWholesaler?.user_id === ws.user_id ? '2px solid #185FA5' : '1px solid #e2e8f0',
              background: selectedWholesaler?.user_id === ws.user_id ? '#f0f7ff' : '#fff',
            }}
          >
            <div style={{ ...styles.wsAvatar, background: selectedWholesaler?.user_id === ws.user_id ? '#185FA5' : '#e6f1fb', color: selectedWholesaler?.user_id === ws.user_id ? '#fff' : '#185FA5' }}>
              {ws.name?.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{ws.mobile}</div>
            </div>
            {selectedWholesaler?.user_id === ws.user_id && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#185FA5', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Listings */}
      {selectedWholesaler && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{selectedWholesaler.name}</span>
              <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>
                {total} total listings · showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)}
              </span>
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={goPrev} disabled={!hasPrev || loading} style={{ ...styles.pageBtn, opacity: !hasPrev ? 0.4 : 1 }}>
                  <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ fontSize: 13, color: '#64748b', padding: '0 4px' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button onClick={goNext} disabled={!hasNext || loading} style={{ ...styles.pageBtn, opacity: !hasNext ? 0.4 : 1 }}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <div style={styles.searchWrap}>
              <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                style={styles.searchInput}
                placeholder="Search product name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              )}
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
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                Loading listings...
              </div>
            ) : (
              <>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['#', 'Product', 'Brand', 'Pack', 'Price', 'Offer', 'Stock', 'MOQ', 'Delivery', 'Status', 'Action'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l, i) => (
                        <tr key={l.listing_id} style={styles.tr}>
                          <td style={{ ...styles.td, color: '#94a3b8', fontSize: 11 }}>{offset + i + 1}</td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={styles.productIcon}><Package size={14} color="#185FA5" /></div>
                              <strong style={{ color: '#0f172a' }}>{l.generic_name}</strong>
                            </div>
                          </td>
                          <td style={styles.td}>{l.brand_name}</td>
                          <td style={styles.td}>{l.attributes?.pack_size || l.attributes?.size || '—'}</td>
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
                          <td style={styles.td}>{l.delivery_days}d</td>
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

                {/* Bottom pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>
                      Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total} listings
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={goPrev} disabled={!hasPrev || loading} style={{ ...styles.pageBtn, opacity: !hasPrev ? 0.4 : 1 }}>
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <button onClick={goNext} disabled={!hasNext || loading} style={{ ...styles.pageBtn, opacity: !hasNext ? 0.4 : 1 }}>
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {!selectedWholesaler && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          ☝️ Select a wholesaler above to view their listings
        </div>
      )}
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
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  wholesalerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 24, maxHeight: 320, overflowY: 'auto', padding: '4px 2px' },
  wholesalerCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' },
  wsAvatar: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  filters: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', flex: 1, maxWidth: 380 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', flex: 1, background: 'transparent' },
  tabFilters: { display: 'flex', gap: 8 },
  tabBtn: { padding: '6px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  tabBtnActive: { background: '#185FA5', color: '#fff', borderColor: '#185FA5' },
  pageBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' },
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
