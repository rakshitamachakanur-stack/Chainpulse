import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import useSocket from '../hooks/useSocket';

const NAV = [
  { to:'/dashboard', icon:'📊', label:'Dashboard'    },
  { to:'/users',     icon:'👥', label:'Users'         },
  { to:'/orders',    icon:'📋', label:'All Orders'    },
  { to:'/admins',    icon:'🛡️', label:'Admin Accounts' },
  { to:'/activity',  icon:'🕐', label:'Activity Log'  },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  useSocket(); // real-time invalidation

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-deep)' }}>
      {/* ── Sidebar ── */}
      <aside style={{ width:248, display:'flex', flexDirection:'column', background:'rgba(14,22,18,0.98)', borderRight:'1px solid var(--border)', height:'100vh', flexShrink:0 }}>

        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 16px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, var(--forest), var(--copper))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🛡️</div>
          <div>
            <p style={{ fontWeight:700, color:'var(--cream)', fontSize:14, letterSpacing:'-0.01em' }}>ChainPulse</p>
            <p style={{ fontSize:10, color:'var(--copper)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600, marginTop:1 }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} style={{ textDecoration:'none' }}>
              <span style={{ width:18, textAlign:'center', fontSize:14 }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ padding:'10px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginBottom:4 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg, var(--forest), var(--copper))', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--cream)', fontWeight:700, fontSize:12, flexShrink:0 }}>
              {admin?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--cream)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{admin?.name}</p>
              <p style={{ fontSize:10, color:'var(--copper)', textTransform:'capitalize', letterSpacing:'0.04em' }}>Admin</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:500, color:'rgba(184,92,56,0.8)', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(184,92,56,0.1)'; e.currentTarget.style.color='#E08060'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='rgba(184,92,56,0.8)'; }}>
            <span style={{ width:18, textAlign:'center', fontSize:14 }}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Topbar */}
        <div style={{ height:46, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 24px', background:'rgba(14,22,18,0.95)', borderBottom:'1px solid var(--border)', flexShrink:0, gap:12 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:999, background:'rgba(44,95,93,0.12)', border:'1px solid rgba(44,95,93,0.25)' }}>
            <span className="live-dot" />
            <span style={{ fontSize:11, color:'var(--pine)', letterSpacing:'0.08em', fontWeight:500 }}>Admin</span>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', position:'relative' }}>
          <div className="dashboard-bg" style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }} />
          <div style={{ position:'relative', zIndex:1, padding:'28px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
