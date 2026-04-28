import { useEffect, useState } from 'react';
import api from '../api';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ user_id: '', action: '', entity_type: '' });
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => { fetchLogs(); }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit,
        offset: page * limit,
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.action && { action: filters.action }),
        ...(filters.entity_type && { entity_type: filters.entity_type }),
      });
      const res = await api.get(`/admin/activity-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleClear = () => {
    setFilters({ user_id: '', action: '', entity_type: '' });
    setPage(0);
    setTimeout(fetchLogs, 0);
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const actionColor = (action) => {
    if (!action) return '#64748b';
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('add')) return '#16a34a';
    if (a.includes('delete') || a.includes('remove')) return '#dc2626';
    if (a.includes('update') || a.includes('edit')) return '#d97706';
    return '#185FA5';
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Activity Logs</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Track all admin and user actions on the platform
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="User ID"
          value={filters.user_id}
          onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))}
          style={styles.input}
        />
        <input
          placeholder="Action (e.g. create, update)"
          value={filters.action}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          style={styles.input}
        />
        <input
          placeholder="Entity type (e.g. product, order)"
          value={filters.entity_type}
          onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}
          style={styles.input}
        />
        <button type="submit" style={styles.filterBtn}>Filter</button>
        <button type="button" style={styles.clearBtn} onClick={handleClear}>Clear</button>
      </form>

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No activity logs found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Entity</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap', color: '#64748b', fontSize: 12 }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>{log.user_name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.user_mobile}</div>
                      {log.role && <div style={{ fontSize: 10, color: '#cbd5e1', textTransform: 'uppercase' }}>{log.role}</div>}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                        fontSize: 11, fontWeight: 600,
                        background: `${actionColor(log.action)}20`,
                        color: actionColor(log.action),
                        textTransform: 'uppercase',
                      }}>
                        {log.action || '—'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: 13, color: '#475569' }}>{log.entity_type || '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.entity_id}</div>
                    </td>
                    <td style={{ ...styles.td, fontSize: 13, color: '#64748b', maxWidth: 240 }}>
                      {log.description || '—'}
                    </td>
                    <td style={{ ...styles.td, fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={styles.pageBtn}>Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total} style={styles.pageBtn}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  input: {
    padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 13, color: '#0f172a', outline: 'none', minWidth: 160,
  },
  filterBtn: {
    padding: '8px 16px', background: '#185FA5', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  clearBtn: {
    padding: '8px 16px', background: '#f1f5f9', color: '#475569',
    border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer',
  },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', textAlign: 'left' },
  td: { padding: '12px 16px', fontSize: 14, color: '#334155', verticalAlign: 'top' },
  pageBtn: {
    padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 13, background: '#fff', color: '#475569', cursor: 'pointer',
  },
};
