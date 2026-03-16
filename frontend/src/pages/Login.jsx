import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Eye, EyeOff, Lock, Mail, User, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'investigator' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const inp = (field, icon) => ({
    value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value }))
  });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name) return toast.error('Name required');
        await register(form.name, form.email, form.password, form.role);
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
      padding: 20,
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(0deg, #c9a227 0px, #c9a227 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #c9a227 0px, #c9a227 1px, transparent 1px, transparent 60px)',
      }} />
      <div style={{ position: 'absolute', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,162,39,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent-gold), #8b6914)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'glowPulse 3s ease infinite',
          }}>
            <Scale size={30} color="#0a0e1a" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: 4 }}>JUSTICE AI</h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Legal Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-secondary)', borderRadius: 8, padding: 3 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem',
                background: mode === m ? 'var(--accent-gold)' : 'transparent',
                color: mode === m ? '#0a0e1a' : 'var(--text-secondary)',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>{m}</button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" {...inp('name')} placeholder="John Doe" style={{ paddingLeft: 36 }} required />
                </div>
              </div>
            )}
            <div>
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" type="email" {...inp('email')} placeholder="you@court.gov.in" style={{ paddingLeft: 36 }} required />
              </div>
            </div>
            <div>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" type={showPwd ? 'text' : 'password'} {...inp('password')} placeholder="••••••••" style={{ paddingLeft: 36, paddingRight: 40 }} required />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label>Role</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={{ paddingLeft: 36 }}>
                    <option value="investigator">Investigator</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8, justifyContent: 'center' }} disabled={loading}>
              {loading ? <><div className="loader" style={{ width: 16, height: 16, borderColor: 'rgba(0,0,0,0.3)', borderTopColor: '#0a0e1a' }} /> Processing...</> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ marginTop: 20, padding: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#60a5fa', marginBottom: 6 }}>DEMO CREDENTIALS</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Register a new account to get started
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 20 }}>
          Justice AI · Ajay Kumar Garg Engineering College · AKTU
        </p>
      </div>
    </div>
  );
}
