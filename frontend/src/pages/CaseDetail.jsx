import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, GitFork, FileText, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CaseDetail() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState({ title: '', description: '', status: 'open', priority: 'medium', jurisdiction: '', category: '', verdict: '', filed_date: '' });
  const [loading, setLoading] = useState(!isNew);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [linkedCases, setLinkedCases] = useState([]);
  const [newEvidence, setNewEvidence] = useState({ title: '', description: '', type: 'document', collected_by: '' });
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.get(`/cases/${id}`).then(r => {
        setC(r.data.data);
        setForm(r.data.data);
        setAiSummary(r.data.data.ai_summary || '');
      }).finally(() => setLoading(false));
      api.get(`/graph/linked-cases/${id}`).then(r => setLinkedCases(r.data.data));
    }
  }, [id]);

  const save = async () => {
    try {
      if (isNew) {
        const { data } = await api.post('/cases', form);
        toast.success('Case created!');
        navigate(`/cases/${data.data.id}`);
      } else {
        await api.put(`/cases/${id}`, form);
        toast.success('Case updated');
        setEditing(false);
        setC(prev => ({ ...prev, ...form }));
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`/ai/summarize/case/${id}`);
      setAiSummary(data.summary);
      toast.success('AI summary generated!');
    } catch (e) { toast.error('AI service unavailable — check your API key'); }
    finally { setAiLoading(false); }
  };

  const addEvidence = async () => {
    try {
      await api.post('/evidence', { ...newEvidence, case_id: id });
      toast.success('Evidence added');
      setShowEvidenceForm(false);
      setNewEvidence({ title: '', description: '', type: 'document', collected_by: '' });
      const { data } = await api.get(`/cases/${id}`);
      setC(data.data);
    } catch { toast.error('Failed to add evidence'); }
  };

  const removeEvidence = async (eid) => {
    if (!window.confirm('Delete this evidence?')) return;
    await api.delete(`/evidence/${eid}`);
    setC(prev => ({ ...prev, Evidence: prev.Evidence.filter(e => e.id !== eid) }));
    toast.success('Evidence removed');
  };

  const inp = (field) => ({ value: form[field] || '', onChange: e => setForm(p => ({ ...p, [field]: e.target.value })), className: 'input' });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loader" /></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/cases')}><ArrowLeft size={14} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-gold)', letterSpacing: '0.1em' }}>
            ◆ {isNew ? 'NEW CASE' : c?.case_number}
          </div>
          <h1 style={{ fontSize: '1.4rem' }}>{isNew ? 'Create New Case' : (editing ? 'Edit Case' : c?.title)}</h1>
        </div>
        {!isNew && !editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 size={13} /> Edit</button>
            <button className="btn btn-primary btn-sm" onClick={generateAI} disabled={aiLoading}>
              {aiLoading ? <><div className="loader" style={{ width: 14, height: 14 }} /> Analyzing...</> : <><Brain size={13} /> AI Summary</>}
            </button>
          </div>
        )}
        {editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { if (isNew) navigate('/cases'); else setEditing(false); }}><X size={13} /></button>
            <button className="btn btn-primary btn-sm" onClick={save}><Save size={13} /> Save</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Case Info */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} color="var(--accent-gold)" /> Case Details
            </h3>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label>Case Title *</label><input {...inp('title')} placeholder="Enter case title" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label>Status</label>
                    <select {...inp('status')}>
                      <option value="open">Open</option><option value="active">Active</option>
                      <option value="pending">Pending</option><option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label>Priority</label>
                    <select {...inp('priority')}>
                      <option value="low">Low</option><option value="medium">Medium</option>
                      <option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </div>
                  <div><label>Jurisdiction</label><input {...inp('jurisdiction')} placeholder="e.g. Delhi High Court" /></div>
                  <div><label>Category</label><input {...inp('category')} placeholder="e.g. Fraud, Homicide" /></div>
                  <div><label>Filed Date</label><input type="date" {...inp('filed_date')} /></div>
                </div>
                <div><label>Description</label><textarea {...inp('description')} rows={4} className="input" placeholder="Detailed case description..." style={{ resize: 'vertical' }} /></div>
                <div><label>Verdict</label><textarea {...inp('verdict')} rows={2} className="input" placeholder="Final verdict (if closed)..." style={{ resize: 'vertical' }} /></div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`badge badge-${c?.status}`}>{c?.status}</span>
                  <span className={`badge badge-${c?.priority}`}>{c?.priority}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['Jurisdiction', c?.jurisdiction], ['Category', c?.category], ['Filed', c?.filed_date]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: '0.95rem' }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {c?.description && <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{c.description}</div>
                </div>}
                {c?.verdict && <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Verdict</div>
                  <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, fontSize: '0.95rem' }}>{c.verdict}</div>
                </div>}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {aiSummary && !isNew && (
            <div className="card" style={{ padding: 24, borderColor: 'rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.04)' }}>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={15} color="var(--accent-gold)" /> AI Analysis
              </h3>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{aiSummary}</div>
            </div>
          )}

          {/* Evidence */}
          {!isNew && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.95rem' }}>Evidence ({c?.Evidence?.length || 0})</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowEvidenceForm(p => !p)}><Plus size={13} /> Add</button>
              </div>
              {showEvidenceForm && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label>Title</label><input className="input" value={newEvidence.title} onChange={e => setNewEvidence(p => ({ ...p, title: e.target.value }))} placeholder="Evidence title" /></div>
                    <div><label>Type</label>
                      <select className="input" value={newEvidence.type} onChange={e => setNewEvidence(p => ({ ...p, type: e.target.value }))}>
                        {['document','physical','digital','testimony','forensic'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><label>Collected By</label><input className="input" value={newEvidence.collected_by} onChange={e => setNewEvidence(p => ({ ...p, collected_by: e.target.value }))} /></div>
                    <div><label>Description</label><input className="input" value={newEvidence.description} onChange={e => setNewEvidence(p => ({ ...p, description: e.target.value }))} /></div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }} onClick={addEvidence}>Add Evidence</button>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c?.Evidence?.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                    <span className={`badge badge-${e.is_verified ? 'active' : 'pending'}`}>{e.type}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.title}</div>
                      {e.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>{e.description}</div>}
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => removeEvidence(e.id)}><Trash2 size={12} /></button>
                  </div>
                ))}
                {!c?.Evidence?.length && <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>No evidence recorded</div>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Suspects */}
          {!isNew && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.9rem' }}>Suspects ({c?.Suspects?.length || 0})</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/suspects`)}><Plus size={12} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c?.Suspects?.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => navigate(`/suspects/${s.id}`)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', color: 'white' }}>
                      {s.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.name}</div>
                      <span className={`badge badge-${s.risk_level}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>{s.risk_level}</span>
                    </div>
                  </div>
                ))}
                {!c?.Suspects?.length && <div style={{ textAlign: 'center', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No suspects linked</div>}
              </div>
            </div>
          )}

          {/* Linked Cases */}
          {linkedCases.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitFork size={14} color="var(--accent-gold)" /> Linked Cases
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {linkedCases.map(lc => (
                  <div key={lc.id} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => navigate(`/cases/${lc.id}`)}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{lc.case_number}</div>
                    <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{lc.title}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {lc.shared_suspects} shared suspect{lc.shared_suspects !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
