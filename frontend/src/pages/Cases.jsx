import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Trash2, Loader } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Cases() {
  const [cases, setCases]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage]       = useState(1);
  const navigate = useNavigate();

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...(search && { search }), ...(status && { status }), ...(priority && { priority }) };
      const { data } = await api.get('/cases', { params });
      setCases(data.data);
      setTotal(data.total);
    } catch (e) { toast.error('Failed to load cases'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCases(); }, [page, status, priority]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this case?')) return;
    try {
      await api.delete(`/cases/${id}`);
      toast.success('Case deleted');
      fetchCases();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', marginBottom: 6 }}>◆ CASE MANAGEMENT</div>
          <h1 style={{ fontSize: '1.6rem' }}>All Cases <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 400 }}>({total})</span></h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>
          <Plus size={15} /> New Case
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCases()}
            style={{ paddingLeft: 36 }} />
        </div>
        <select className="input" style={{ width: 150 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input" style={{ width: 150 }} value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchCases}><Filter size={14} /> Filter</button>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loader" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Case #</th><th>Title</th><th>Status</th><th>Priority</th>
                <th>Suspects</th><th>Jurisdiction</th><th>Filed</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                  <td><span className="mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>{c.case_number}</span></td>
                  <td style={{ fontWeight: 500, maxWidth: 200 }}>{c.title}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td><span className={`badge badge-${c.priority}`}>{c.priority}</span></td>
                  <td><span className="mono" style={{ fontSize: '0.82rem' }}>{c.Suspects?.length || 0}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{c.jurisdiction || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.filed_date || c.created_at?.slice(0, 10)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/cases/${c.id}`)}><Eye size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={e => handleDelete(c.id, e)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!cases.length && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                  No cases found
                </td></tr>
              )}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {total > 10 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
