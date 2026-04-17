import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState({});
  const [savingProduct, setSavingProduct] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/admin/products/${id}`), api.get('/admin/categories')])
      .then(([pRes, cRes]) => {
        setData(pRes.data);
        setCategories(cRes.data.categories);
        initProductForm(pRes.data.product);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const initProductForm = (p) => setProductForm({
    generic_name: p.generic_name || '',
    category_id: p.category_id || '',
    hsn_code: p.hsn_code || '',
    description: p.description || '',
    search_keywords: (p.search_keywords || []).join(', '),
    is_active: p.is_active,
  });

  const saveProduct = async () => {
    setSavingProduct(true); setError('');
    try {
      const res = await api.put(`/admin/products/${id}`, {
        ...productForm,
        search_keywords: productForm.search_keywords
          ? productForm.search_keywords.split(',').map(s => s.trim())
          : [],
      });
      setData(prev => ({ ...prev, product: res.data.product }));
      setEditingProduct(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSavingProduct(false); }
  };

  const saveVariant = async (variantData, variantId) => {
    try {
      let res;
      if (variantId) {
        res = await api.put(`/admin/variants/${variantId}`, variantData);
        setData(prev => ({ ...prev, variants: prev.variants.map(v => v.variant_id === variantId ? res.data.variant : v) }));
      } else {
        res = await api.post(`/admin/products/${id}/variants`, variantData);
        setData(prev => ({ ...prev, variants: [...prev.variants, res.data.variant] }));
      }
      setShowAddVariant(false);
      setEditingVariant(null);
    } catch (err) {
      throw err;
    }
  };

  const deleteVariant = async (variantId) => {
    if (!confirm('Delete this variant?')) return;
    try {
      await api.delete(`/admin/variants/${variantId}`);
      setData(prev => ({ ...prev, variants: prev.variants.filter(v => v.variant_id !== variantId) }));
    } catch (err) { console.error(err); }
  };

  if (loading) return <Loader />;
  if (!data) return <div style={{ padding: 32, color: '#94a3b8' }}>Product not found</div>;

  const { product, variants } = data;

  return (
    <div className="fade-in">
      <button style={styles.backBtn} onClick={() => navigate('/products')}>
        <ArrowLeft size={16} /> Back to Products
      </button>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Product card */}
      <div style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <div style={styles.productIcon}>{product.generic_name?.charAt(0)}</div>
          <div>
            <h2 style={styles.productName}>{product.generic_name}</h2>
            <div style={styles.headerMeta}>
              <span style={styles.catBadge}>{product.category_name}</span>
              <span style={{ ...styles.statusBadge, ...(product.is_active ? styles.badgeActive : styles.badgeInactive) }}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!editingProduct ? (
            <button style={styles.editBtn} onClick={() => setEditingProduct(true)}><Pencil size={14} /> Edit</button>
          ) : (
            <>
              <button style={styles.cancelBtn} onClick={() => { setEditingProduct(false); initProductForm(product); }}>Cancel</button>
              <button style={styles.saveBtn} onClick={saveProduct} disabled={savingProduct}>{savingProduct ? 'Saving...' : 'Save'}</button>
            </>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        {/* Product info */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Product Info</h3>
          {editingProduct ? (
            <div style={styles.formGrid}>
              <Field label="Generic Name" value={productForm.generic_name} onChange={v => setProductForm(f => ({ ...f, generic_name: v }))} />
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Category</label>
                <select style={styles.select} value={productForm.category_id} onChange={e => setProductForm(f => ({ ...f, category_id: e.target.value }))}>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                </select>
              </div>
              <Field label="HSN Code" value={productForm.hsn_code} onChange={v => setProductForm(f => ({ ...f, hsn_code: v }))} />
              <Field label="Description" value={productForm.description} onChange={v => setProductForm(f => ({ ...f, description: v }))} textarea />
              <Field label="Search Keywords (comma separated)" value={productForm.search_keywords} onChange={v => setProductForm(f => ({ ...f, search_keywords: v }))} />
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Status</label>
                <select style={styles.select} value={productForm.is_active ? 'true' : 'false'} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <InfoRow label="Generic Name" value={product.generic_name} />
              <InfoRow label="Category" value={product.category_name} />
              <InfoRow label="HSN Code" value={product.hsn_code || '—'} />
              <InfoRow label="Description" value={product.description || '—'} />
              <InfoRow label="Keywords" value={product.search_keywords?.join(', ') || '—'} />
              <InfoRow label="Created" value={new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </div>
          )}
        </div>

        {/* Variants */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Variants ({variants.length})</h3>
            <button style={styles.addVariantBtn} onClick={() => { setShowAddVariant(true); setEditingVariant(null); }}>
              <Plus size={13} /> Add Variant
            </button>
          </div>

          {variants.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
              No variants yet. Add the first one.
            </div>
          )}

          {variants.map(v => (
            <div key={v.variant_id} style={styles.variantCard}>
              <div style={styles.variantHeader}>
                <div>
                  <div style={styles.variantBrand}>{v.brand_name}</div>
                  {v.manufacturer && <div style={styles.variantMfr}>{v.manufacturer}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {v.is_approved
                    ? <span style={styles.approvedBadge}><CheckCircle size={12} /> Approved</span>
                    : <span style={styles.pendingBadge}><XCircle size={12} /> Pending</span>}
                  <button style={styles.iconBtn} onClick={() => { setEditingVariant(v); setShowAddVariant(false); }}>
                    <Pencil size={13} color="#185FA5" />
                  </button>
                  <button style={styles.iconBtn} onClick={() => deleteVariant(v.variant_id)}>
                    <Trash2 size={13} color="#dc2626" />
                  </button>
                </div>
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
          ))}
        </div>
      </div>

      {/* Add/Edit Variant Modal */}
      {(showAddVariant || editingVariant) && (
        <VariantModal
          variant={editingVariant}
          onClose={() => { setShowAddVariant(false); setEditingVariant(null); }}
          onSave={saveVariant}
        />
      )}
    </div>
  );
}

function VariantModal({ variant, onClose, onSave }) {
  const [form, setForm] = useState({
    brand_name: variant?.brand_name || '',
    manufacturer: variant?.manufacturer || '',
    is_approved: variant?.is_approved || false,
    attributes: variant?.attributes || {},
  });
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addAttr = () => {
    if (!attrKey.trim()) return;
    setForm(f => ({ ...f, attributes: { ...f.attributes, [attrKey.trim()]: attrVal.trim() } }));
    setAttrKey(''); setAttrVal('');
  };

  const removeAttr = (key) => {
    const attrs = { ...form.attributes };
    delete attrs[key];
    setForm(f => ({ ...f, attributes: attrs }));
  };

  const save = async () => {
    if (!form.brand_name) return setError('Brand name required');
    setSaving(true); setError('');
    try {
      await onSave(form, variant?.variant_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save variant');
    } finally { setSaving(false); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{variant ? 'Edit Variant' : 'Add Variant'}</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {error && <div style={styles.errorBox}>{error}</div>}

        <Field label="Brand Name *" value={form.brand_name} onChange={v => setForm(f => ({ ...f, brand_name: v }))} />
        <Field label="Manufacturer" value={form.manufacturer} onChange={v => setForm(f => ({ ...f, manufacturer: v }))} />

        <div style={styles.fieldWrap}>
          <label style={styles.fieldLabel}>Approved</label>
          <select style={styles.select} value={form.is_approved ? 'true' : 'false'}
            onChange={e => setForm(f => ({ ...f, is_approved: e.target.value === 'true' }))}>
            <option value="true">✓ Approved</option>
            <option value="false">✗ Pending Approval</option>
          </select>
        </div>

        {/* Attributes */}
        <div style={styles.fieldWrap}>
          <label style={styles.fieldLabel}>Attributes</label>
          {Object.entries(form.attributes).map(([k, v]) => (
            <div key={k} style={styles.attrRow}>
              <span style={styles.attrKey}>{k.replace(/_/g, ' ')}</span>
              <span style={styles.attrVal}>{String(v)}</span>
              <button style={styles.removeAttrBtn} onClick={() => removeAttr(k)}>✕</button>
            </div>
          ))}
          <div style={styles.addAttrRow}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Key (e.g. weight_kg)" value={attrKey} onChange={e => setAttrKey(e.target.value)} />
            <input style={{ ...styles.input, flex: 1 }} placeholder="Value (e.g. 50)" value={attrVal} onChange={e => setAttrVal(e.target.value)} />
            <button style={styles.addAttrBtn} onClick={addAttr}>+</button>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            Common keys: weight_kg, grade, pack_type, colour, size, unit
          </div>
        </div>

        <button style={styles.submitBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : variant ? 'Update Variant' : 'Add Variant'}
        </button>
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

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, textAlign: 'right', maxWidth: 240, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function Loader() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>;
}

const styles = {
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 },
  errorBox: { background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 },
  headerCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  productIcon: { width: 52, height: 52, borderRadius: 14, background: '#e6f1fb', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 },
  productName: { fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  headerMeta: { display: 'flex', gap: 8 },
  catBadge: { background: '#e6f1fb', color: '#185FA5', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  badgeActive: { background: '#e1f5ee', color: '#1D9E75' },
  badgeInactive: { background: '#fee2e2', color: '#dc2626' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer' },
  cancelBtn: { padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' },
  saveBtn: { padding: '9px 18px', borderRadius: 10, border: 'none', background: '#185FA5', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, alignItems: 'start' },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 },
  formGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none' },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff' },
  addVariantBtn: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  variantCard: { border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px', marginBottom: 10 },
  variantHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  variantBrand: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  variantMfr: { fontSize: 12, color: '#64748b', marginTop: 2 },
  approvedBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#1D9E75', background: '#e1f5ee', padding: '3px 8px', borderRadius: 20 },
  pendingBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: 20 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' },
  attrGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 },
  attrItem: { background: '#f8fafc', borderRadius: 6, padding: '5px 8px' },
  attrKey: { display: 'block', fontSize: 10, color: '#94a3b8', textTransform: 'capitalize', marginBottom: 1 },
  attrVal: { fontSize: 12, fontWeight: 600, color: '#0f172a' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 },
  attrRow: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 6, padding: '6px 10px', marginBottom: 6 },
  addAttrRow: { display: 'flex', gap: 8, marginTop: 8 },
  removeAttrBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, marginLeft: 'auto' },
  addAttrBtn: { padding: '0 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer' },
  submitBtn: { width: '100%', padding: '12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
};
