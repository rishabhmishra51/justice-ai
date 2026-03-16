import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, UserX } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Suspects() {
  const [suspects, setSuspects] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [risk, setRisk]         = useState('');
  const [page, setPage]         = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', alias: '', nationality: '', occupation: '', risk_level: 'medium', status: 'active', notes: '' });
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...(search && { search }), ...(status && { status }), ...(risk && { risk_level: risk }) };
      const { data } = await api.get('/suspects', { params });
      setSuspects(data.data);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page, status, risk]);

  const createSuspect = async () => {
    try {
      await api.post('/suspects', form);
      toast.success('Suspect added');
      setShowForm(false);
      setForm({ name: '', alias: '', nationality: '', occupation: '', risk_level: 'medium', status: 'active', notes: '' });
      fetch();
    } catch { toast.error('Failed to create suspect'); }
  };

  const del = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this suspect?')) return;
    await api.delete(`/suspects/${id}`);
    toast.success('Deleted');
    fetch();
  };

  const inp = (field) => ({ value: form[field] || '', onChange: e => setForm(p => ({ ...p, [field]: e.target.value })), className: 'input' });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', marginBottom: 6 }}>◆ SUSPECT DATABASE</div>
          <h1 style={{ fontSize: '1.6rem' }}>Suspects <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 400 }}>({total})</span></h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}><Plus size={15} /> Add Suspect</button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card slide-in" style={{ padding: 24, marginBottom: 20, borderColor: 'rgba(201,162,39,0.3)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: 16 }}>New Suspect</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div><label>Full Name *</label><input {...inp('name')} placeholder="John Doe" /></div>
            <div><label>Alias</label><input {...inp('alias')} placeholder="Known alias" /></div>
            <div><label>Nationality</label><input {...inp('nationality')} /></div>
            <div><label>Occupation</label><input {...inp('occupation')} /></div>
            <div><label>Risk Level</label>
              <select {...inp('risk_level')}>
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div><label>Status</label>
              <select {...inp('status')}>
                <option value="active">Active</option><option value="arrested">Arrested</option>
                <option value="acquitted">Acquitted</option><option value="deceased">Deceased</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea {...inp('notes')} rows={2} className="input" style={{ resize: 'vertical' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={createSuspect}>Create Suspect</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search suspects..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch()} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 140 }} value={risk} onChange={e => setRisk(e.target.value)}>
          <option value="">All Risk</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select className="input" style={{ width: 140 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option><option value="arrested">Arrested</option>
          <option value="acquitted">Acquitted</option><option value="deceased">Deceased</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loader" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {suspects.map(s => (
            <div key={s.id} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => navigate(`/suspects/${s.id}`)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${s.risk_level === 'critical' ? '#ef4444,#7f1d1d' : s.risk_level === 'high' ? '#f97316,#7c2d12' : s.risk_level === 'medium' ? '#eab308,#713f12' : '#22c55e,#14532d'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                  {s.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{s.name}</div>
                  {s.alias && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>aka "{s.alias}"</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className={`badge badge-${s.risk_level}`}>{s.risk_level} risk</span>
                <span className={`badge badge-${s.status}`}>{s.status}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                {s.Cases?.length || 0} case{s.Cases?.length !== 1 ? 's' : ''} linked
                {s.occupation && ` · ${s.occupation}`}
              </div>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/suspects/${s.id}`)}><Eye size={12} /> View</button>
                <button className="btn btn-danger btn-sm" onClick={e => del(s.id, e)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {!suspects.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <UserX size={32} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              No suspects found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
