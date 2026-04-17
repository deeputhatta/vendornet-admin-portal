import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Search, Plus, ChevronRight } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/admin/products'), api.get('/admin/categories')])
      .then(([pRes, cRes]) => {
        setProducts(pRes.data.products);
        setCategories(cRes.data.categories);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.hsn_code?.includes(search);
    const matchCat = catFilter === 'all' || p.category_id === catFilter;
    return matchSearch && matchCat;
  });

  const toggleActive = async (id, current, e) => {
    e.stopPropagation();
    try {
      const p = products.find(p => p.product_id === id);
      await api.put(`/admin/products/${id}`, { ...p, is_active: !current });
      setProducts(prev => prev.map(p => p.product_id === id ? { ...p, is_active: !current } : p));
    } catch (err) { console.error(err); }
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSub}>{products.length} products · {categories.length} categories</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {showAdd && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSave={(p) => { setProducts(prev => [p, ...prev]); setShowAdd(false); }}
        />
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrap}>
          <Search size={16} color="#94a3b8" />
          <input style={styles.searchInput} placeholder="Search product or HSN..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={styles.catFilters}>
          <button style={{ ...styles.catBtn, ...(catFilter === 'all' ? styles.catBtnActive : {}) }} onClick={() => setCatFilter('all')}>All</button>
          {categories.map(c => (
            <button key={c.category_id}
              style={{ ...styles.catBtn, ...(catFilter === c.category_id ? styles.catBtnActive : {}) }}
              onClick={() => setCatFilter(c.category_id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Product', 'Category', 'HSN Code', 'Variants', 'Status', ''].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.product_id} style={{ ...styles.tr, cursor: 'pointer' }}
                onClick={() => navigate(`/products/${p.product_id}`)}>
                <td style={styles.td}><strong style={{ color: '#0f172a' }}>{p.generic_name}</strong></td>
                <td style={styles.td}>
                  <span style={styles.catBadge}>{p.category_name}</span>
                </td>
                <td style={styles.td}><span style={styles.mono}>{p.hsn_code || '—'}</span></td>
                <td style={styles.td}>
                  <span style={styles.variantCount}>{p.variant_count} variant{p.variant_count !== 1 ? 's' : ''}</span>
                </td>
                <td style={styles.td}>
                  <button
                    style={{ ...styles.toggleBtn, ...(p.is_active ? styles.activeBtn : styles.inactiveBtn) }}
                    onClick={(e) => toggleActive(p.product_id, p.is_active, e)}
                  >
                    {p.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td style={styles.td}><ChevronRight size={16} color="#94a3b8" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={styles.empty}>No products found</div>}
      </div>
    </div>
  );
}

function AddProductModal({ categories, onClose, onSave }) {
  const [form, setForm] = useState({ generic_name: '', category_id: '', hsn_code: '', description: '', search_keywords: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.generic_name || !form.category_id) return setError('Name and category required');
    setSaving(true); setError('');
    try {
      const res = await api.post('/admin/products', {
        ...form,
        search_keywords: form.search_keywords ? form.search_keywords.split(',').map(s => s.trim()) : [],
      });
      onSave(res.data.product);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Add Product" onClose={onClose}>
      {error && <div style={styles.errorBox}>{error}</div>}
      <Field label="Generic Name *" value={form.generic_name} onChange={v => setForm(f => ({ ...f, generic_name: v }))} />
      <div style={styles.fieldWrap}>
        <label style={styles.fieldLabel}>Category *</label>
        <select style={styles.select} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
          <option value="">Select category</option>
          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
      </div>
      <Field label="HSN Code" value={form.hsn_code} onChange={v => setForm(f => ({ ...f, hsn_code: v }))} />
      <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
      <Field label="Search Keywords (comma separated)" value={form.search_keywords} onChange={v => setForm(f => ({ ...f, search_keywords: v }))} />
      <button style={styles.submitBtn} onClick={save} disabled={saving}>{saving ? 'Creating...' : 'Create Product'}</button>
    </Modal>
  );
}

function Loader() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>{label}</label>
      {textarea
        ? <textarea style={{ ...styles.input, height: 72, resize: 'vertical' }} value={value} onChange={e => onChange(e.target.value)} />
        : <input style={styles.input} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
  pageSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  filters: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', maxWidth: 380 },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, color: '#0f172a', flex: 1, background: 'transparent' },
  catFilters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catBtn: { padding: '5px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  catBtnActive: { background: '#185FA5', color: '#fff', borderColor: '#185FA5' },
  tableCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: 13, color: '#334155', whiteSpace: 'nowrap' },
  catBadge: { background: '#e6f1fb', color: '#185FA5', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  mono: { fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#64748b' },
  variantCount: { color: '#64748b', fontSize: 12 },
  toggleBtn: { padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  activeBtn: { background: '#e1f5ee', color: '#1D9E75' },
  inactiveBtn: { background: '#fee2e2', color: '#dc2626' },
  empty: { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 },
  errorBox: { background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none' },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none', background: '#fff' },
  submitBtn: { width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
};
