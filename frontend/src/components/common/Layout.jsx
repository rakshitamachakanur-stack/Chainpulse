import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import LiveClock from '../animations/LiveClock';
import LiveIndicator from '../animations/LiveIndicator';
import useSocket from '../../hooks/useSocket';
import AIAssistantWidget from './AIAssistantWidget';

const ROLE_CONFIG = {
  procurement: {
    accent:'#C68642', activeBg:'rgba(198,134,66,0.12)', activeBorder:'rgba(198,134,66,0.25)',
    activeText:'#C68642', label:'Procurement', icon:'🛒',
    nav:[
      {to:'/dashboard',    icon:'⚡', label:'Dashboard'},
      {to:'/requisitions', icon:'📝', label:'Requisitions & Forecast'},
      {to:'/orders',       icon:'📋', label:'Purchase Orders'},
      {to:'/suppliers',    icon:'🏆', label:'Suppliers & Scorecards'},
      {to:'/products',     icon:'📦', label:'Products'},
      {to:'/invoices',     icon:'🧾', label:'Invoices'},
      {to:'/reports',      icon:'📈', label:'Reports'},
    ],
  },
  warehouse: {
    accent:'#2C5F5D', activeBg:'rgba(44,95,93,0.15)', activeBorder:'rgba(44,95,93,0.3)',
    activeText:'#7FC4BF', label:'Warehouse', icon:'🏪',
    nav:[
      {to:'/dashboard', icon:'⚡', label:'Dashboard'},
      {to:'/inventory', icon:'📦', label:'Inventory & Forecast'},
      {to:'/receiving', icon:'📥', label:'Goods Receiving'},
      {to:'/dispatch',  icon:'📤', label:'Dispatch'},
      {to:'/transfers', icon:'🔄', label:'Transfers'},
      {to:'/reports',   icon:'📈', label:'Reports'},
    ],
  },
  logistics: {
    accent:'#7AAE8E', activeBg:'rgba(122,174,142,0.12)', activeBorder:'rgba(122,174,142,0.25)',
    activeText:'#7AAE8E', label:'Logistics', icon:'🚚',
    nav:[
      {to:'/dashboard',  icon:'⚡', label:'Dashboard'},
      {to:'/shipments',  icon:'📦', label:'Shipments & QR'},
      {to:'/tracking',   icon:'🗺️', label:'Fleet Radar & Map'},
      {to:'/deliveries', icon:'🎯', label:'Deliveries'},
      {to:'/fleet',      icon:'🚛', label:'Fleet'},
      {to:'/reports',    icon:'📈', label:'Reports'},
    ],
  },
  manager: {
    accent:'#B85C38', activeBg:'rgba(184,92,56,0.12)', activeBorder:'rgba(184,92,56,0.25)',
    activeText:'#E08060', label:'Manager', icon:'👔',
    nav:[
      {to:'/dashboard',  icon:'⚡', label:'Dashboard'},
      {to:'/approvals',  icon:'✅', label:'Approvals'},
      {to:'/orders',     icon:'📋', label:'All Orders'},
      {to:'/suppliers',  icon:'🏆', label:'Suppliers & Scorecards'},
      {to:'/inventory',  icon:'📦', label:'Inventory & Forecast'},
      {to:'/shipments',  icon:'🗺️', label:'Shipments & Map'},
      {to:'/analytics',  icon:'📉', label:'Analytics'},
      {to:'/reports',    icon:'📈', label:'Reports'},
    ],
  },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.procurement;

  // Real-time WebSocket: invalidates React Query caches on peer mutations
  useSocket();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll().then(r => r.data),
    refetchInterval: 10000,
  });
  const unread = notifData?.unread || 0;

  const Sidebar = ({ mobile=false }) => (
    <aside style={{ width:248, display:'flex', flexDirection:'column', background:'rgba(14,23,20,0.98)', borderRight:'1px solid rgba(94,139,126,0.14)', height:'100vh', flexShrink:0 }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 16px 16px', borderBottom:'1px solid rgba(94,139,126,0.1)' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:cfg.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'rgba(20,30,27,0.9)', fontWeight:800, flexShrink:0 }}>C</div>
        <div>
          <p style={{ fontWeight:700, color:'#F8F4EC', fontSize:14, letterSpacing:'-0.01em' }}>ChainPulse</p>
          <p style={{ fontSize:10, color:cfg.accent, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600, marginTop:1 }}>{cfg.label}</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
        {cfg.nav.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => isActive ? { background:cfg.activeBg, color:cfg.activeText, borderLeft:`3px solid ${cfg.accent}`, paddingLeft:10 } : {}}>
            <span style={{ width:18, textAlign:'center', fontSize:14 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Notifications */}
      <div style={{ padding:'0 10px 4px' }}>
        <NavLink to="/notifications" onClick={() => mobile && setMobileOpen(false)}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span style={{ width:18, textAlign:'center', fontSize:14 }}>🔔</span>
          <span>Notifications</span>
          {unread > 0 && (
            <span className="badge-bounce" style={{ marginLeft:'auto', background:'#B85C38', color:'#F8F4EC', fontSize:10, fontWeight:700, borderRadius:999, padding:'1px 6px' }}>{unread}</span>
          )}
        </NavLink>
      </div>

      {/* User footer */}
      <div style={{ padding:'10px', borderTop:'1px solid rgba(94,139,126,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', marginBottom:4 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:cfg.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(20,30,27,0.9)', fontWeight:700, fontSize:12, flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:'#F8F4EC', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize:10, color:cfg.accent, textTransform:'capitalize', letterSpacing:'0.04em' }}>{user?.role}</p>
          </div>
        </div>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive?'active':''}`} onClick={() => mobile && setMobileOpen(false)}>
          <span style={{ width:18, textAlign:'center', fontSize:14 }}>👤</span><span>Profile</span>
        </NavLink>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="nav-link" style={{ width:'100%', background:'none', border:'none', cursor:'pointer', color:'rgba(184,92,56,0.8)' }}>
          <span style={{ width:18, textAlign:'center', fontSize:14 }}>🚪</span><span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-deep)' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex"><Sidebar /></div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex' }} className="md:hidden">
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position:'relative', zIndex:10 }}><Sidebar mobile /></div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Topbar */}
        <div style={{ height:48, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(14,23,20,0.95)', borderBottom:'1px solid rgba(94,139,126,0.1)', flexShrink:0 }}>
          {/* Mobile menu btn */}
          <button className="md:hidden" onClick={() => setMobileOpen(true)} style={{ background:'none', border:'none', color:'rgba(212,207,196,0.6)', fontSize:18, cursor:'pointer' }}>☰</button>
          <div className="hidden md:block" />
          {/* Right side: Live indicator + clock */}
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <LiveIndicator />
            <LiveClock />
            <div style={{ width:28, height:28, borderRadius:'50%', background:cfg.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(20,30,27,0.9)', fontWeight:700, fontSize:12 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Dot-grid page background + content */}
        <main style={{ flex:1, overflowY:'auto', position:'relative' }}>
          <div className="dashboard-bg" style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }} />
          <div style={{ position:'relative', zIndex:1, padding:'28px' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI Supply Chain Assistant */}
      <AIAssistantWidget />
    </div>
  );
}
