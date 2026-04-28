import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import api from '../api';

const MOQ_ENFORCEMENT_OPTIONS = ['block', 'warn', 'round_up'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', floor_moq: 1, moq_enforcement: 'block', is_active: true });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (e) {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', slug: '', description: '', floor_moq: 1, moq_enforcement: 'block', is_active: true });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      floor_moq: cat.floor_moq ?? 1,
      moq_enforcement: cat.moq_enforcement || 'block',
      is_active: cat.is_active !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const handleNameChange = (name) => {
    setForm(f => ({ ...f, name, slug: editItem ? f.slug : slugify(name) }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/categories/${editItem.category_id}`, form);
      } else {
        await api.post('/categories', form);
      }
      closeModal();
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This may affect products using it.')) return;
    setDeleteId(id);
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete category.');
    } finally {
      setDeleteId(null);
    }
  };

  const moqLabel = (m) => ({ block: 'Block', warn: 'Warn', round_up: 'Round Up' }[m] || m);
  const moqColor = (m) => ({ block: '#dc2626', warn: '#d97706', round_up: '#2563eb' }[m] || '#64748b');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Categories</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Manage product categories for the platform</p>
        </div>
        <button onClick={openAdd} style={styles.addBtn}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No categories found.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Slug</th>
                <th style={styles.th}>Floor MOQ</th>
                <th style={styles.th}>MOQ Rule</th>
                <th style={styles.th}>Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.category_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{cat.name}</div>
                    {cat.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{cat.description}</div>}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{cat.slug}</td>
                  <td style={{ ...styles.td, fontSize: 13 }}>{cat.floor_moq ?? 1}</td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                      fontSize: 11, fontWeight: 600,
                      background: `${moqColor(cat.moq_enforcement)}15`,
                      color: moqColor(cat.moq_enforcement),
                    }}>
                      {moqLabel(cat.moq_enforcement)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      background: cat.is_active !== false ? '#dcfce7' : '#fee2e2',
                      color: cat.is_active !== false ? '#16a34a' : '#dc2626',
                    }}>
                      {cat.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button onClick={() => openEdit(cat)} style={styles.iconBtn} title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.category_id)}
                      disabled={deleteId === cat.category_id}
                      style={{ ...styles.iconBtn, color: '#ef4444', marginLeft: 4 }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editItem ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} style={styles.closeBtn}><X size={18} /></button>
            </div>

            <label style={styles.label}>Name *</label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Grocery & FMCG" style={styles.input} />

            <label style={{ ...styles.label, marginTop: 12 }}>Slug *</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. grocery-fmcg" style={styles.input} />

            <label style={{ ...styles.label, marginTop: 12 }}>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" style={styles.input} />

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Floor MOQ</label>
                <input type="number" min="1" value={form.floor_moq} onChange={e => setForm(f => ({ ...f, floor_moq: parseInt(e.target.value) || 1 }))} style={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>MOQ Rule</label>
                <select value={form.moq_enforcement} onChange={e => setForm(f => ({ ...f, moq_enforcement: e.target.value }))} style={styles.input}>
                  {MOQ_ENFORCEMENT_OPTIONS.map(o => <option key={o} value={o}>{moqLabel(o)}</option>)}
                </select>
              </div>
            </div>

            <label style={{ ...styles.label, marginTop: 12 }}>Status</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {[true, false].map(val => (
                <button key={String(val)} onClick={() => setForm(f => ({ ...f, is_active: val }))}
                  style={{ ...styles.toggleBtn, background: form.is_active === val ? '#185FA5' : '#f1f5f9', color: form.is_active === val ? '#fff' : '#475569' }}>
                  {val ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} style={styles.saveBtn}>
                {saving ? 'Saving...' : <><Check size={15} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  addBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textAlign: 'left', background: '#f8fafc' },
  td: { padding: '12px 16px', fontSize: 14, color: '#334155' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, borderRadius: 6, display: 'inline-flex' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: '#fff', borderRadius: 14, padding: 28, width: 480, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', boxSizing: 'border-box', outline: 'none' },
  toggleBtn: { padding: '7px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', color: '#475569', cursor: 'pointer' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#185FA5', color: '#fff', cursor: 'pointer' },
};
