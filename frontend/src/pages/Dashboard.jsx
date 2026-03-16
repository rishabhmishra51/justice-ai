import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FolderOpen, Users, FileSearch, AlertTriangle, TrendingUp, Clock, Scale } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#6b7280', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading Justice AI...</div>
    </div>
  );

  const statCards = [
    { label: 'Total Cases',     value: stats?.totalCases,    icon: FolderOpen,    color: '#3b82f6', sub: `${stats?.openCases} open` },
    { label: 'Suspects',        value: stats?.totalSuspects, icon: Users,          color: '#f97316', sub: 'in database' },
    { label: 'Evidence Items',  value: stats?.totalEvidence, icon: FileSearch,     color: '#22c55e', sub: 'collected' },
    { label: 'Critical Cases',  value: stats?.criticalCases, icon: AlertTriangle,  color: '#ef4444', sub: 'need attention' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            ◆ COMMAND CENTER
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            Welcome back, <span className="text-gold">{user?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '1rem' }}>
            Here's the current state of all active investigations.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>
          + New Case
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: color, borderRadius: '8px 0 0 8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, color }}>{value ?? '—'}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Cases by Status */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--accent-gold)" /> Cases by Status
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats?.casesByStatus || []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {(stats?.casesByStatus || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(stats?.casesByStatus || []).map(({ status, count }, i) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status} ({count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suspects by Risk */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--accent-gold)" /> Suspects by Risk Level
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.suspectsByRisk || []} barSize={32}>
              <XAxis dataKey="risk" tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(stats?.suspectsByRisk || []).map((entry, i) => {
                  const riskColor = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
                  return <Cell key={i} fill={riskColor[entry.risk] || '#3b82f6'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="var(--accent-gold)" /> Recent Cases
        </h3>
        <table>
          <thead>
            <tr>
              <th>Case #</th><th>Title</th><th>Status</th><th>Priority</th><th>Filed</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.recentCases || []).map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/cases/${c.id}`)}>
                <td><span className="mono" style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>{c.case_number}</span></td>
                <td style={{ fontWeight: 500 }}>{c.title}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                <td><span className={`badge badge-${c.priority}`}>{c.priority}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {!stats?.recentCases?.length && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                No cases yet — <span style={{ color: 'var(--accent-gold)', cursor: 'pointer' }} onClick={() => navigate('/cases/new')}>create your first case</span>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
