import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, FolderOpen, Users, FileSearch,
  GitFork, Brain, LogOut, Scale
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases',      icon: FolderOpen,      label: 'Cases' },
  { to: '/suspects',   icon: Users,            label: 'Suspects' },
  { to: '/graph',      icon: GitFork,          label: 'Network Graph' },
  { to: '/ai',         icon: Brain,            label: 'AI Analysis' },
  { to: '/evidence',   icon: FileSearch,       label: 'Evidence' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside style={{
      width: '220px', minWidth: '220px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-gold), #8b6914)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'glowPulse 3s ease infinite'
          }}>
            <Scale size={18} color="#0a0e1a" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-gold)', lineHeight: 1 }}>
              JUSTICE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
              AI SYSTEM
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '6px',
            fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600,
            color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(201,162,39,0.1)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
            transition: 'all 0.15s',
            textDecoration: 'none',
          })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: 'white'
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, truncate: true }}>{user?.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
