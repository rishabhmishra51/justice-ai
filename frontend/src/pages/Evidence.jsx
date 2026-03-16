import { useState, useEffect } from 'react';
import { FileSearch, CheckCircle, Clock } from 'lucide-react';
import api from '../utils/api';

export default function EvidencePage() {
  const [cases, setCases]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cases', { params: { limit: 50 } }).then(r => setCases(r.data.data)).finally(() => setLoading(false));
  }, []);

  // Aggregate all evidence
  const allEvidence = cases.flatMap(c => (c.Evidence || []).map(e => ({ ...e, case_number: c.case_number, case_title: c.title })));

  const byType = allEvidence.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {});
  const typeColors = { document: '#3b82f6', physical: '#f97316', digital: '#06b6d4', testimony: '#8b5cf6', forensic: '#ec4899' };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', marginBottom: 6 }}>◆ EVIDENCE VAULT</div>
        <h1 style={{ fontSize: '1.6rem' }}>Evidence Registry</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>All collected evidence across active cases</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(byType).map(([type, count]) => (
          <div key={type} className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[type] || '#6b7280' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{type}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: typeColors[type] || '#6b7280' }}>{count}</span>
          </div>
        ))}
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="loader" /></div> : (
        <div className="card">
          <table>
            <thead>
              <tr><th>Title</th><th>Type</th><th>Case</th><th>Collected By</th><th>Verified</th><th>Date</th></tr>
            </thead>
            <tbody>
              {allEvidence.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{e.title}</div>
                    {e.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{e.description.slice(0, 60)}{e.description.length > 60 ? '...' : ''}</div>}
                  </td>
                  <td>
                    <span style={{ background: (typeColors[e.type] || '#6b7280') + '22', color: typeColors[e.type] || '#6b7280', border: `1px solid ${(typeColors[e.type] || '#6b7280')}44` }} className="badge">
                      {e.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{e.case_number}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{e.case_title}</div>
                  </td>
                  <td style={{ fontSize: '0.88rem' }}>{e.collected_by || '—'}</td>
                  <td>
                    {e.is_verified ? <CheckCircle size={16} color="#22c55e" /> : <Clock size={16} color="#6b7280" />}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {e.created_at?.slice(0, 10)}
                  </td>
                </tr>
              ))}
              {!allEvidence.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <FileSearch size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 10px' }} />
                  No evidence recorded — add evidence from case detail pages
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
