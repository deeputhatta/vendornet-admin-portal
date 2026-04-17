import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Phone, MapPin, Building, Users, ShoppingBag, CheckCircle, XCircle, Shield, Pencil, X, Save } from 'lucide-react';

const ROLE_CONFIG = {
  retailer_admin:   { label: 'Retailer',         color: '#185FA5', bg: '#e6f1fb' },
  retailer_staff:   { label: 'Retailer Staff',   color: '#185FA5', bg: '#e6f1fb' },
  wholesaler_admin: { label: 'Wholesaler',        color: '#1D9E75', bg: '#e1f5ee' },
  wholesaler_staff: { label: 'Wholesaler Staff', color: '#1D9E75', bg: '#e1f5ee' },
  retailer:         { label: 'Retailer',         color: '#185FA5', bg: '#e6f1fb' },
  wholesaler:       { label: 'Wholesaler',        color: '#1D9E75', bg: '#e1f5ee' },
  admin:            { label: 'Admin',             color: '#7c3aed', bg: '#ede9fe' },
  driver:           { label: 'Driver',            color: '#b45309', bg: '#fef3c7' },
};

const ALL_ROLES = ['retailer_admin','retailer_staff','wholesaler_admin','wholesaler_staff','admin','driver','retailer','wholesaler'];

const PERMISSIONS = [
  { key: 'view_orders',      label: 'View Orders' },
  { key: 'accept_orders',    label: 'Accept Orders' },
  { key: 'manage_listings',  label: 'Manage Listings' },
  { key: 'view_analytics',   label: 'View Analytics' },
  { key: 'upload_invoice',   label: 'Upload Invoice' },
  { key: 'assign_driver',    label: 'Assign Driver' },
  { key: 'place_orders',     label: 'Place Orders' },
  { key: 'manage_staff',     label: 'Manage Staff' },
];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.get(`/admin/users/${id}`)
      .then(res => {
        setData(res.data);
        initForm(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const initForm = (d) => {
    setForm({
      name: d.user.name || '',
      email: d.user.email || '',
      address: d.user.address || '',
      pincode: d.user.pincode || '',
      language_pref: d.user.language_pref || 'en',
      role: d.user.role || '',
      gstin: d.user.gstin || '',
      // wholesaler profile
      business_name: d.profile?.business_name || '',
      delivery_radius: d.profile?.default_delivery_radius_km || '',
      profile_gstin: d.profile?.gstin || '',
      is_verified: d.profile?.is_verified || false,
    });
  };

  const toggleUser = async () => {
    setToggling(true);
    try {
      const res = await api.put(`/admin/users/${id}/toggle`);
      setData(prev => ({ ...prev, user: { ...prev.user, is_active: res.data.user.is_active } }));
    } catch (err) { console.error(err); }
    finally { setToggling(false); }
  };

  const saveEdit = async () => {
    setSaving(true); setSaveError('');
    try {
      await api.put(`/admin/users/${id}`, {
        name: form.name,
        email: form.email || null,
        address: form.address || null,
        pincode: form.pincode || null,
        language_pref: form.language_pref,
        role: form.role,
        gstin: form.gstin || null,
        ...(data.profile && {
          business_name: form.business_name,
          delivery_radius: form.delivery_radius ? parseFloat(form.delivery_radius) : undefined,
          gstin: form.profile_gstin || null,
          is_verified: form.is_verified,
        }),
      });
      // Reload data
      const res = await api.get(`/admin/users/${id}`);
      setData(res.data);
      initForm(res.data);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <Loader />;
  if (!data) return <div style={{ padding: 32, color: '#94a3b8' }}>User not found</div>;

  const { user, profile, staff, parent, orders } = data;
  const rc = ROLE_CONFIG[user.role] || { label: user.role, color: '#64748b', bg: '#f1f5f9' };

  return (
    <div className="fade-in">
      {/* Back */}
      <button style={styles.backBtn} onClick={() => navigate('/users')}>
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* Header card */}
      <div style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.avatar, background: rc.bg, color: rc.color }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 style={styles.userName}>{user.name}</h2>
            <div style={styles.headerMeta}>
              <span style={{ ...styles.badge, background: rc.bg, color: rc.color }}>{rc.label}</span>
              <span style={{ ...styles.badge, ...(user.is_active ? styles.badgeActive : styles.badgeInactive) }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={styles.userId}>ID: {user.user_id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!editing ? (
            <button style={styles.editBtn} onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <>
              <button style={styles.cancelBtn} onClick={() => { setEditing(false); initForm(data); setSaveError(''); }}>
                <X size={14} /> Cancel
              </button>
              <button style={styles.saveBtn} onClick={saveEdit} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          {user.role !== 'admin' && (
            <button
              style={{ ...styles.toggleBtn, ...(user.is_active ? styles.deactivateBtn : styles.activateBtn) }}
              onClick={toggleUser} disabled={toggling}
            >
              {toggling ? '...' : user.is_active ? 'Block User' : 'Activate User'}
            </button>
          )}
        </div>
      </div>

      {saveError && <div style={styles.errorBox}>{saveError}</div>}

      <div style={styles.grid}>
        {/* Left column */}
        <div style={styles.leftCol}>
          {/* Basic info */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Basic Info</h3>
            {editing ? (
              <div style={styles.formGrid}>
                <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
                <Field label="GSTIN" value={form.gstin} onChange={v => setForm(f => ({ ...f, gstin: v }))} />
                <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} textarea />
                <Field label="Pincode" value={form.pincode} onChange={v => setForm(f => ({ ...f, pincode: v }))} />
                <div style={styles.fieldWrap}>
                  <label style={styles.fieldLabel}>Language</label>
                  <select style={styles.select} value={form.language_pref} onChange={e => setForm(f => ({ ...f, language_pref: e.target.value }))}>
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>
                <div style={styles.fieldWrap}>
                  <label style={styles.fieldLabel}>Role</label>
                  <select style={styles.select} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r} ({r})</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div style={styles.infoRows}>
                <InfoRow icon={<Phone size={14} />} label="Mobile" value={user.mobile} />
                {user.email && <InfoRow label="Email" value={user.email} />}
                {user.gstin && <InfoRow icon={<Shield size={14} />} label="GSTIN" value={user.gstin} />}
                {user.address && <InfoRow icon={<MapPin size={14} />} label="Address" value={user.address} />}
                {user.pincode && <InfoRow label="Pincode" value={user.pincode} />}
                <InfoRow label="Language" value={user.language_pref?.toUpperCase() || 'EN'} />
                <InfoRow label="Joined" value={new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              </div>
            )}
          </div>

          {/* Wholesaler profile */}
          {profile && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Business Profile</h3>
              {editing ? (
                <div style={styles.formGrid}>
                  <Field label="Business Name" value={form.business_name} onChange={v => setForm(f => ({ ...f, business_name: v }))} />
                  <Field label="GSTIN" value={form.profile_gstin} onChange={v => setForm(f => ({ ...f, profile_gstin: v }))} />
                  <Field label="Delivery Radius (km)" value={form.delivery_radius} onChange={v => setForm(f => ({ ...f, delivery_radius: v }))} type="number" />
                  <div style={styles.fieldWrap}>
                    <label style={styles.fieldLabel}>Verified</label>
                    <select style={styles.select} value={form.is_verified ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_verified: e.target.value === 'true' }))}>
                      <option value="true">✓ Verified</option>
                      <option value="false">✗ Not Verified</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div style={styles.infoRows}>
                  <InfoRow icon={<Building size={14} />} label="Business" value={profile.business_name} />
                  {profile.gstin && <InfoRow label="GSTIN" value={profile.gstin} />}
                  <InfoRow label="Delivery Radius" value={`${profile.default_delivery_radius_km} km`} />
                  <InfoRow label="Rating" value={`${profile.rating} ★`} />
                  <InfoRow label="Verified" value={profile.is_verified ? '✓ Verified' : '✗ Not verified'} />
                  {profile.warehouse_lat && <InfoRow icon={<MapPin size={14} />} label="Location" value={`${profile.warehouse_lat}, ${profile.warehouse_lng}`} />}
                </div>
              )}
            </div>
          )}

          {/* Parent (for staff) */}
          {parent && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Associated With</h3>
              <div style={styles.parentBox}>
                <div style={{ ...styles.avatar, width: 40, height: 40, fontSize: 16, background: rc.bg, color: rc.color }}>
                  {parent.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{parent.name}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{parent.mobile}</div>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{ROLE_CONFIG[parent.role]?.label || parent.role}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={styles.rightCol}>
          {/* Staff members */}
          {staff?.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Users size={15} style={{ display: 'inline', marginRight: 6 }} />Staff Members ({staff.length})</h3>
              {staff.map((s, i) => (
                <div key={i} style={styles.staffRow}>
                  <div style={{ ...styles.avatar, width: 32, height: 32, fontSize: 13, background: '#e6f1fb', color: '#185FA5' }}>
                    {s.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.mobile}</div>
                  </div>
                  <span style={{ ...styles.badge, ...(s.staff_active ? styles.badgeActive : styles.badgeInactive) }}>
                    {s.staff_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {staff[0]?.permissions && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permissions</div>
                  <div style={styles.permGrid}>
                    {PERMISSIONS.map(p => {
                      const allowed = staff[0].permissions?.[p.key];
                      return (
                        <div key={p.key} style={{ ...styles.permItem, color: allowed ? '#1D9E75' : '#94a3b8' }}>
                          {allowed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                          {p.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent orders */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><ShoppingBag size={15} style={{ display: 'inline', marginRight: 6 }} />Recent Orders</h3>
            {orders?.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['ID', 'Amount', 'Status', 'Date'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.order_id || o.sub_order_id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.orderId}>#{(o.order_id || o.sub_order_id).slice(0, 8).toUpperCase()}</span></td>
                      <td style={styles.td}><strong style={{ color: '#185FA5' }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</strong></td>
                      <td style={styles.td}>{o.status || '—'}</td>
                      <td style={styles.td}>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '8px 0' }}>No orders yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, type }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>{label}</label>
      {textarea ? (
        <textarea style={{ ...styles.input, height: 72, resize: 'vertical' }} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input style={styles.input} type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, minWidth: 100 }}>{icon}{label}</div>
      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, textAlign: 'right', maxWidth: 200, wordBreak: 'break-all' }}>{value}</div>
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
  headerCard: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  avatar: { width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  headerMeta: { display: 'flex', gap: 8, marginBottom: 4 },
  userId: { fontSize: 11, color: '#94a3b8', fontFamily: 'DM Mono, monospace' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  badgeActive: { background: '#e1f5ee', color: '#1D9E75' },
  badgeInactive: { background: '#fee2e2', color: '#dc2626' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#185FA5', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' },
  toggleBtn: { padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  deactivateBtn: { background: '#fee2e2', color: '#dc2626' },
  activateBtn: { background: '#e1f5ee', color: '#1D9E75' },
  errorBox: { background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14, display: 'flex', alignItems: 'center' },
  infoRows: { display: 'flex', flexDirection: 'column' },
  formGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: 500, color: '#64748b' },
  input: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', width: '100%' },
  select: { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff' },
  parentBox: { display: 'flex', alignItems: 'center', gap: 12 },
  staffRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' },
  permGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  permItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '10px 0', fontSize: 13, color: '#334155' },
  orderId: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: 4 },
};
