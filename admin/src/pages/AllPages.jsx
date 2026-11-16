import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminAPI } from '../services/api';
import Modal from '../components/Modal';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import NetworkBackground from '../components/animations/NetworkBackground';
import { CyclingTerminal } from '../components/animations/TypingTerminal';

// ── shared helpers ─────────────────────────────────────────────────────────────
const TT = { contentStyle:{ background:'rgba(14,22,18,0.95)', border:'1px solid rgba(94,139,126,0.2)', borderRadius:10, color:'#F8F4EC', fontSize:12 } };
const safe = (d,fmt) => d && !isNaN(new Date(d)) ? format(new Date(d), fmt) : '—';
const ROLE_COL = { manager:'#B85C38', warehouse:'#2C5F5D', logistics:'#7AAE8E', procurement:'#C68642' };
const STATUS_COL = { delivered:'#7AAE8E', shipped:'#5E8B7E', pending:'#C68642', cancelled:'#E08060', approved:'#5E8B7E', draft:'rgba(212,207,196,0.35)', processing:'#7FC4BF', in_transit:'#5E8B7E', out_for_delivery:'#C68642' };

function Spinner() {
  return <div style={{ width:16, height:16, border:'2px solid rgba(26,15,5,0.3)', borderTopColor:'#1A0F05', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>;
}
function PageSpinner() {
  return <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><div style={{ width:28, height:28, border:'2px solid rgba(94,139,126,0.2)', borderTopColor:'var(--copper)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/></div>;
}
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:8, alignItems:'center', marginTop:20 }}>
      <button disabled={page===1} onClick={()=>onPage(page-1)} className="btn btn-secondary btn-sm" style={{ opacity:page===1?0.4:1 }}>← Prev</button>
      <span style={{ fontSize:13, color:'rgba(212,207,196,0.4)' }}>Page {page} of {pages}</span>
      <button disabled={page===pages} onClick={()=>onPage(page+1)} className="btn btn-secondary btn-sm" style={{ opacity:page===pages?0.4:1 }}>Next →</button>
    </div>
  );
}

// ── Admin-specific terminal messages ──────────────────────────────────────────
const ADMIN_MESSAGES = [
  'Monitoring 160 active users...',
  'All systems operational...',
  'Inventory synced across warehouses...',
  '3 requisitions pending approval...',
  'Last backup: 2 minutes ago...',
  'Audit log: 12 events today...',
];

// Admin capability cards shown on left panel
const ADMIN_CAPS = [
  { icon:'👥', label:'User Management',   desc:'Create & manage roles',    color:'#2C5F5D' },
  { icon:'📋', label:'All Orders',        desc:'Cross-module visibility',   color:'#C68642' },
  { icon:'🛡️', label:'Admin Accounts',   desc:'Access control',            color:'#5E8B7E' },
  { icon:'🕐', label:'Activity Log',      desc:'Real-time audit trail',     color:'#B85C38' },
];

// ── Login ─────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, admin } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  if (admin) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome, Admin!');
      navigate('/dashboard');
    } catch(err) {
      const msg = err.code==='ERR_NETWORK'
        ? 'Cannot reach server — is the backend running on port 5000?'
        : (err.response?.data?.message || 'Login failed');
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#080F0D', overflow:'hidden', position:'relative' }}>

      {/* ── Animated network canvas ── */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <NetworkBackground />
      </div>

      {/* ── Left panel ── */}
      <motion.div
        initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }}
        transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
        style={{
          width:440, flexDirection:'column', justifyContent:'center',
          padding:'64px 56px', position:'relative', zIndex:1,
          background:'rgba(14,22,18,0.55)', borderRight:'1px solid rgba(94,139,126,0.12)',
          backdropFilter:'blur(16px)',
          // hide on small screens
          display:'flex',
        }}
        className="hidden lg:flex"
      >
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#2C5F5D,#C68642)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:22, color:'#F8F4EC' }}>🛡️</div>
          <div>
            <p style={{ fontWeight:800, fontSize:22, color:'#F8F4EC', letterSpacing:'-0.02em' }}>ChainPulse</p>
            <p style={{ fontSize:11, color:'rgba(198,134,66,0.7)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:1 }}>Admin Console</p>
          </div>
        </div>

        {/* Tagline */}
        <h2 style={{ fontSize:30, fontWeight:700, color:'#F8F4EC', lineHeight:1.25, marginBottom:12, letterSpacing:'-0.02em' }}>
          Full visibility.<br/>
          <span style={{ color:'#C68642' }}>Total control.</span><br/>
          One admin panel.
        </h2>

        {/* Cycling terminal */}
        <div style={{ margin:'24px 0 36px', padding:'12px 16px', background:'rgba(11,18,16,0.6)', borderRadius:10, border:'1px solid rgba(94,139,126,0.15)', fontFamily:'monospace' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            {['#B85C38','#C68642','#2C5F5D'].map((c,i)=>(
              <span key={i} style={{ width:8, height:8, borderRadius:'50%', background:c, opacity:0.7 }}/>
            ))}
          </div>
          <span style={{ fontSize:11, color:'rgba(94,139,126,0.6)', fontFamily:'monospace' }}>$ chainpulse-admin --status</span><br/>
          <CyclingTerminal messages={ADMIN_MESSAGES} pause={2000} />
        </div>

        {/* Capability pills */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {ADMIN_CAPS.map(c => (
            <div key={c.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:9, background:'rgba(44,95,93,0.07)', border:'1px solid rgba(94,139,126,0.1)' }}>
              <span style={{ fontSize:14 }}>{c.icon}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(212,207,196,0.75)' }}>{c.label}</span>
              <span style={{ fontSize:11, color:'rgba(212,207,196,0.35)', marginLeft:'auto' }}>{c.desc}</span>
              <div style={{ width:5, height:5, borderRadius:'50%', background:c.color, flexShrink:0 }}/>
            </div>
          ))}
        </div>

        {/* Restricted access notice */}
        <div style={{ marginTop:28, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, background:'rgba(184,92,56,0.08)', border:'1px solid rgba(184,92,56,0.18)' }}>
          <span style={{ fontSize:12 }}>⚠️</span>
          <p style={{ fontSize:11, color:'rgba(224,128,96,0.75)' }}>Restricted access. All sessions are logged.</p>
        </div>
      </motion.div>

      {/* ── Right panel — login form ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', zIndex:1 }}>
        <motion.div
          initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.45, delay:0.1, ease:[0.16,1,0.3,1] }}
          style={{ width:'100%', maxWidth:420 }}
        >
          {/* Mobile logo — only shows when left panel is hidden */}
          <div className="lg:hidden" style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#2C5F5D,#C68642)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:24, color:'#F8F4EC', margin:'0 auto 12px' }}>🛡️</div>
            <p style={{ fontWeight:800, fontSize:20, color:'#F8F4EC' }}>ChainPulse Admin</p>
          </div>

          {/* Form card */}
          <div style={{ background:'rgba(14,22,18,0.82)', border:'1px solid rgba(94,139,126,0.2)', borderRadius:20, padding:'36px 32px', backdropFilter:'blur(24px)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#F8F4EC', marginBottom:6, letterSpacing:'-0.01em' }}>Admin Sign In</h2>
            <p style={{ fontSize:13, color:'rgba(212,207,196,0.4)', marginBottom:28 }}>Access the ChainPulse admin console</p>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label className="label">Admin Email</label>
                <input className="input" type="email" placeholder="admin@chainpulse.com"
                  value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showPass?'text':'password'} placeholder="••••••••"
                    style={{ paddingRight:44 }}
                    value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, color:'rgba(212,207,196,0.4)' }}>
                    {showPass?'🙈':'👁️'}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading} whileTap={{ scale:0.97 }}
                style={{
                  marginTop:4, padding:'13px 20px', borderRadius:12, border:'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit', fontSize:14, fontWeight:700, letterSpacing:'0.02em',
                  background: loading ? 'rgba(44,95,93,0.4)' : 'linear-gradient(135deg,#2C5F5D,#3D7A77)',
                  color:'#F8F4EC', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(44,95,93,0.3)',
                  transition:'all 0.2s',
                }}>
                {loading
                  ? <><div style={{ width:16, height:16, border:'2px solid rgba(248,244,236,0.25)', borderTopColor:'#F8F4EC', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Signing in…</>
                  : '🔐 Sign In'}
              </motion.button>
            </form>

            {/* Demo credentials */}
            <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(94,139,126,0.12)' }}>
              <p style={{ fontSize:11, color:'rgba(212,207,196,0.3)', marginBottom:10, textAlign:'center', textTransform:'uppercase', letterSpacing:'0.06em' }}>Demo — click to fill</p>
              <button
                onClick={()=>setForm({email:'admin@chainpulse.com', password:'Admin@123'})}
                style={{ width:'100%', background:'rgba(44,95,93,0.1)', border:'1px solid rgba(94,139,126,0.15)', borderRadius:10, padding:'11px 14px', cursor:'pointer', textAlign:'left', transition:'all 0.15s ease', fontFamily:'inherit' }}
                onMouseEnter={e=>{ e.currentTarget.style.background='rgba(44,95,93,0.2)'; e.currentTarget.style.borderColor='rgba(198,134,66,0.4)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='rgba(44,95,93,0.1)'; e.currentTarget.style.borderColor='rgba(94,139,126,0.15)'; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#C68642' }}/>
                  <span style={{ fontSize:12, fontWeight:700, color:'rgba(212,207,196,0.85)' }}>Admin</span>
                  <span style={{ fontSize:10, color:'rgba(212,207,196,0.3)', marginLeft:4 }}>Full access</span>
                </div>
                <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)', fontFamily:'monospace' }}>admin@chainpulse.com</p>
              </button>
            </div>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:'rgba(212,207,196,0.25)', marginTop:20 }}>
            User portal → <span style={{ color:'rgba(212,207,196,0.4)' }}>localhost:3000</span>
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { data:stats } = useQuery({ queryKey:['admin-stats'],    queryFn:()=>adminAPI.getStats().then(r=>r.data.data), refetchInterval:15000 });
  const { data:act }   = useQuery({ queryKey:['admin-activity'], queryFn:()=>adminAPI.getActivity().then(r=>r.data.data), refetchInterval:30000 });
  const chartData = (act?.orders||[]).slice(0,8).map(o=>({ name:o.orderNumber?.split('-')[2]||'?', value:o.totalAmount||0 }));

  const STATS = [
    ['👥','Total Users',     stats?.users,       '#7FC4BF'],
    ['📋','Total Orders',    stats?.orders,      'var(--cream)'],
    ['🏭','Suppliers',       stats?.suppliers,   'var(--pine)'],
    ['🚚','Shipments',       stats?.shipments,   'var(--sage)'],
    ['✅','Active Users',    stats?.activeUsers, '#7AAE8E'],
    ['⏳','Pending Reqs',    stats?.pendingReqs, 'var(--copper)'],
    ['⚠️','Low Stock',       stats?.lowStock,    '#E08060'],
    ['🗃️','Inventory Items', stats?.inventory,   'var(--cream-muted)'],
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="section-accent"><h1 className="page-title">Admin Dashboard</h1></div>
        </div>
        <span style={{ padding:'4px 14px', borderRadius:999, background:'rgba(44,95,93,0.15)', border:'1px solid rgba(44,95,93,0.3)', color:'var(--pine)', fontSize:12, fontWeight:600 }}>🛡️ Admin</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:28 }}>
        {STATS.map(([icon,label,val,color],i)=>(
          <motion.div key={label} className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
            style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:11, color:'rgba(212,207,196,0.4)', marginBottom:4 }}>{label}</p>
                <p style={{ fontSize:24, fontWeight:700, color, fontFamily:'monospace' }}>{val??'—'}</p>
              </div>
              <span style={{ fontSize:22, opacity:0.7 }}>{icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="copper-divider" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <h3 className="section-title">Recent Order Values</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,139,126,0.1)"/>
              <XAxis dataKey="name" stroke="rgba(212,207,196,0.2)" tick={{ fontSize:11, fill:'rgba(212,207,196,0.35)' }}/>
              <YAxis stroke="rgba(212,207,196,0.2)" tick={{ fontSize:11, fill:'rgba(212,207,196,0.35)' }} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`}/>
              <Tooltip {...TT} formatter={v=>[`$${v.toLocaleString()}`,'Value']}/>
              <Bar dataKey="value" fill="#C68642" radius={[6,6,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
          <h3 className="section-title">Recent Orders</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(act?.orders||[]).slice(0,6).map(o=>(
              <div key={o._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.1)', borderRadius:10 }}>
                <div>
                  <p style={{ fontFamily:'monospace', fontSize:12, color:'var(--copper)', fontWeight:600 }}>{o.orderNumber}</p>
                  <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)', marginTop:2 }}>{o.createdBy?.name||'Unknown'}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontWeight:700, color:'var(--cream)', fontFamily:'monospace' }}>${o.totalAmount?.toLocaleString()}</p>
                  <p style={{ fontSize:11, color:STATUS_COL[o.status]||'rgba(212,207,196,0.35)', textTransform:'capitalize', marginTop:2 }}>{o.status}</p>
                </div>
              </div>
            ))}
            {(act?.orders||[]).length===0&&<p style={{ textAlign:'center', color:'rgba(212,207,196,0.3)', padding:'32px 0', fontSize:13 }}>No recent orders</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
const EMPTY_USER = { name:'', email:'', password:'', role:'warehouse', phone:'', department:'', isActive:true };

export function Users() {
  const qc = useQueryClient();
  const [page,setPage]=useState(1);
  const [filters,setFilters]=useState({search:'',role:'',isActive:''});
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState(EMPTY_USER);

  const { data,isLoading } = useQuery({ queryKey:['admin-users',page,filters], queryFn:()=>adminAPI.getUsers({page,limit:15,...filters}).then(r=>r.data), refetchInterval:30000 });
  const createMut = useMutation({ mutationFn:adminAPI.createUser,  onSuccess:()=>{ qc.invalidateQueries(['admin-users']); qc.invalidateQueries(['admin-stats']); toast.success('User created'); setModal(null); }, onError:e=>toast.error(e.response?.data?.message||'Error') });
  const updateMut = useMutation({ mutationFn:({id,d})=>adminAPI.updateUser(id,d), onSuccess:()=>{ qc.invalidateQueries(['admin-users']); toast.success('Updated'); setModal(null); } });
  const toggleMut = useMutation({ mutationFn:adminAPI.toggleUser,  onSuccess:()=>{ qc.invalidateQueries(['admin-users']); qc.invalidateQueries(['admin-stats']); } });
  const deleteMut = useMutation({ mutationFn:adminAPI.deleteUser,  onSuccess:()=>{ qc.invalidateQueries(['admin-users']); qc.invalidateQueries(['admin-stats']); toast.success('User deleted'); } });

  const openCreate = () => { setForm(EMPTY_USER); setModal('create'); };
  const openEdit   = u  => { setForm({name:u.name,email:u.email,password:'',role:u.role,phone:u.phone||'',department:u.department||'',isActive:u.isActive}); setModal({mode:'edit',data:u}); };
  const handleSubmit = e => {
    e.preventDefault();
    const payload = {...form}; if(modal!=='create'&&!payload.password) delete payload.password;
    if(modal==='create') createMut.mutate(payload); else updateMut.mutate({id:modal.data._id,d:payload});
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">User Management</h1></div></div>
        <button onClick={openCreate} className="btn btn-primary">+ Create User</button>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
        <input className="input" style={{ width:220 }} placeholder="Search name, email…" value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))}/>
        <select className="select" style={{ width:160 }} value={filters.role} onChange={e=>setFilters(p=>({...p,role:e.target.value}))}>
          <option value="">All Roles</option>
          {['manager','warehouse','logistics','procurement'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select" style={{ width:130 }} value={filters.isActive} onChange={e=>setFilters(p=>({...p,isActive:e.target.value}))}>
          <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
        </select>
        <span style={{ alignSelf:'center', fontSize:12, color:'rgba(212,207,196,0.35)', marginLeft:'auto' }}>{data?.total||0} users</span>
      </div>

      {isLoading ? <PageSpinner/> : (
        <>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data?.data?.map((u,i)=>(
                <motion.tr key={u._id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.03 }}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:`${ROLE_COL[u.role]||'var(--forest)'}22`, display:'flex', alignItems:'center', justifyContent:'center', color:ROLE_COL[u.role]||'var(--pine)', fontWeight:700, fontSize:12, flexShrink:0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ color:'var(--cream-muted)', fontWeight:500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{u.email}</td>
                  <td>
                    <span style={{ padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:600, textTransform:'capitalize',
                      background:`${ROLE_COL[u.role]||'rgba(94,139,126,0.18)'}22`,
                      color:ROLE_COL[u.role]||'var(--pine)',
                      border:`1px solid ${ROLE_COL[u.role]||'rgba(94,139,126,0.3)'}44` }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'rgba(212,207,196,0.4)' }}>{u.department||'—'}</td>
                  <td>
                    <button onClick={()=>toggleMut.mutate(u._id)} style={{ padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', transition:'all 0.15s',
                      background:u.isActive?'rgba(44,95,93,0.2)':'rgba(184,92,56,0.15)',
                      color:u.isActive?'#7FC4BF':'#E08060' }}>
                      {u.isActive?'Active':'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>openEdit(u)} className="btn btn-secondary btn-sm">Edit</button>
                      <button onClick={()=>{ if(window.confirm('Delete this user?')) deleteMut.mutate(u._id); }} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {data?.data?.length===0&&<tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'rgba(212,207,196,0.3)' }}>No users found</td></tr>}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
        </>
      )}

      <Modal isOpen={!!modal} onClose={()=>setModal(null)} title={modal==='create'?'Create User':'Edit User'} size="md">
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
            <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">Password {modal!=='create'&&'(leave blank to keep)'}</label>
              <input className="input" type="password" required={modal==='create'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Role</label>
              <select className="select" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                {['manager','warehouse','logistics','procurement'].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
            <div><label className="label">Department</label><input className="input" value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}/></div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMut.isPending||updateMut.isPending}>
              {(createMut.isPending||updateMut.isPending)?<Spinner/>:(modal==='create'?'Create User':'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
export function Orders() {
  const [page,setPage]=useState(1);
  const [status,setStatus]=useState('');
  const { data,isLoading } = useQuery({ queryKey:['admin-orders',page,status], queryFn:()=>adminAPI.getOrders({page,limit:20,status}).then(r=>r.data), refetchInterval:20000 });

  return (
    <div>
      <div className="page-header">
        <div className="section-accent"><h1 className="page-title">All Orders</h1></div>
        <select className="select" style={{ width:180 }} value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['draft','pending','approved','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[['Total',data?.total||0,'📋','var(--cream)'],
          ['Pending',data?.data?.filter(o=>o.status==='pending').length||0,'⏳','var(--copper)'],
          ['Delivered',data?.data?.filter(o=>o.status==='delivered').length||0,'✅','#7AAE8E'],
          ['Cancelled',data?.data?.filter(o=>o.status==='cancelled').length||0,'❌','#E08060'],
        ].map(([l,v,ic,c])=>(
          <div key={l} className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div><p style={{ fontSize:11, color:'rgba(212,207,196,0.35)' }}>{l}</p><p style={{ fontSize:22, fontWeight:700, fontFamily:'monospace', color:c, marginTop:2 }}>{v}</p></div>
              <span style={{ fontSize:20, opacity:0.6 }}>{ic}</span>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? <PageSpinner/> : (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Order #</th><th>Supplier</th><th>Created By</th><th>Items</th><th>Total</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {data?.data?.map(o=>(
              <tr key={o._id}>
                <td><span style={{ fontFamily:'monospace', color:'var(--copper)', fontSize:12, fontWeight:600 }}>{o.orderNumber}</span></td>
                <td style={{ color:'rgba(212,207,196,0.7)' }}>{o.supplier?.name||'—'}</td>
                <td>
                  <div style={{ color:'rgba(212,207,196,0.7)', fontSize:13 }}>{o.createdBy?.name||'—'}</div>
                  <div style={{ fontSize:11, color:'rgba(212,207,196,0.3)' }}>{o.createdBy?.email}</div>
                </td>
                <td style={{ color:'rgba(212,207,196,0.45)' }}>{o.items?.length}</td>
                <td style={{ fontWeight:700, color:'var(--cream)', fontFamily:'monospace' }}>${o.totalAmount?.toLocaleString()}</td>
                <td>
                  <span style={{ fontSize:11, fontWeight:600, textTransform:'capitalize',
                    color:{low:'rgba(212,207,196,0.4)',medium:'var(--pine)',high:'var(--copper)',critical:'#E08060'}[o.priority]||'rgba(212,207,196,0.4)' }}>
                    {o.priority}
                  </span>
                </td>
                <td>
                  <span style={{ padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500,
                    color:STATUS_COL[o.status]||'rgba(212,207,196,0.4)',
                    background:`${STATUS_COL[o.status]||'rgba(212,207,196,0.1)'}18`,
                    border:`1px solid ${STATUS_COL[o.status]||'rgba(212,207,196,0.1)'}30` }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ fontSize:11, color:'rgba(212,207,196,0.3)', fontFamily:'monospace' }}>{safe(o.createdAt,'MMM d, yyyy')}</td>
              </tr>
            ))}
            {data?.data?.length===0&&<tr><td colSpan={8} style={{ textAlign:'center', padding:'40px 0', color:'rgba(212,207,196,0.3)' }}>No orders found</td></tr>}
          </tbody>
        </table></div>
      )}
      <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Admin Accounts ─────────────────────────────────────────────────────────────
export function Admins() {
  const { admin:me } = useAdminAuth();
  const qc = useQueryClient();
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({name:'',email:'',password:''});
  const { data,isLoading } = useQuery({ queryKey:['admin-admins'], queryFn:()=>adminAPI.getAdmins().then(r=>r.data.data) });
  const createMut = useMutation({
    mutationFn: adminAPI.createAdmin,
    onSuccess: () => { qc.invalidateQueries(['admin-admins']); toast.success('Admin created'); setModal(false); },
    onError: e => toast.error(e.response?.data?.message||'Error'),
  });

  return (
    <div>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Admin Accounts</h1></div></div>
        <button onClick={()=>{ setForm({name:'',email:'',password:''}); setModal(true); }} className="btn btn-primary">+ Add Admin</button>
      </div>

      {isLoading ? <PageSpinner/> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {data?.map((a,i)=>(
            <motion.div key={a._id} className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              style={{ borderColor: a._id===me?._id ? 'var(--border-copper)' : 'var(--border)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'var(--cream)', background:'linear-gradient(135deg, var(--forest), var(--copper))' }}>
                    {a.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:'var(--cream)' }}>{a.name}</p>
                    <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)' }}>{a.email}</p>
                  </div>
                </div>
                {a._id===me?._id && (
                  <span style={{ padding:'2px 8px', borderRadius:999, fontSize:10, fontWeight:700, background:'rgba(198,134,66,0.18)', color:'var(--copper)', border:'1px solid rgba(198,134,66,0.3)' }}>You</span>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12 }}>
                {[
                  ['Role',   <span style={{ padding:'2px 8px', borderRadius:999, fontSize:10, background:'rgba(44,95,93,0.2)', color:'#7FC4BF', border:'1px solid rgba(44,95,93,0.3)' }}>Admin</span>],
                  ['Status', <span className={a.isActive?'badge-green':'badge-red'}>{a.isActive?'Active':'Inactive'}</span>],
                  ['Last Login', <span style={{ fontFamily:'monospace', fontSize:11, color:'rgba(212,207,196,0.4)' }}>{safe(a.lastLogin,'MMM d, yyyy')}</span>],
                ].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'rgba(212,207,196,0.35)' }}>{k}</span>{v}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          {data?.length===0&&<p style={{ color:'rgba(212,207,196,0.3)', fontSize:13 }}>No admin accounts found</p>}
        </div>
      )}

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Create Admin Account" size="sm">
        <form onSubmit={e=>{ e.preventDefault(); createMut.mutate(form); }} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          <div><label className="label">Password *</label><input className="input" type="password" required value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/></div>
          <div style={{ background:'rgba(44,95,93,0.06)', border:'1px solid rgba(44,95,93,0.14)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'rgba(212,207,196,0.45)' }}>
            ℹ️ New accounts are created with full <strong style={{ color:'var(--copper)' }}>Admin</strong> privileges.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={()=>setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
              {createMut.isPending?<Spinner/>:'Create Admin'}
            </button>
          </div>
        </form>
      </Modal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Activity Log ──────────────────────────────────────────────────────────────
export function Activity() {
  const { data,isLoading,refetch } = useQuery({ queryKey:['admin-activity'], queryFn:()=>adminAPI.getActivity().then(r=>r.data.data), refetchInterval:30000 });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="section-accent"><h1 className="page-title">Activity Log</h1></div>
          <p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>Auto-refreshes every 30s</p>
        </div>
        <button onClick={()=>refetch()} className="btn btn-secondary">↻ Refresh</button>
      </div>

      {isLoading ? <PageSpinner/> : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <span className="pulse-dot pulse-copper"/>
              <h3 className="section-title" style={{ marginBottom:0 }}>Recent Orders</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(data?.orders||[]).map(o=>(
                <div key={o._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.1)', borderRadius:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:'rgba(44,95,93,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>📋</div>
                    <div>
                      <p style={{ fontFamily:'monospace', fontSize:12, color:'var(--copper)', fontWeight:600 }}>{o.orderNumber}</p>
                      <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)', marginTop:1 }}>by {o.createdBy?.name||'Unknown'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontWeight:700, color:'var(--cream)', fontFamily:'monospace', fontSize:13 }}>${o.totalAmount?.toLocaleString()}</p>
                    <p style={{ fontSize:11, textTransform:'capitalize', color:STATUS_COL[o.status]||'rgba(212,207,196,0.4)', marginTop:1 }}>{o.status}</p>
                    <p style={{ fontSize:10, color:'rgba(212,207,196,0.25)', fontFamily:'monospace' }}>{safe(o.updatedAt,'MMM d, HH:mm')}</p>
                  </div>
                </div>
              ))}
              {(data?.orders||[]).length===0&&<p style={{ textAlign:'center', color:'rgba(212,207,196,0.3)', padding:'32px 0', fontSize:13 }}>No recent orders</p>}
            </div>
          </motion.div>

          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <span className="pulse-dot pulse-forest"/>
              <h3 className="section-title" style={{ marginBottom:0 }}>Recent Shipments</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(data?.shipments||[]).map(s=>(
                <div key={s._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.1)', borderRadius:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:'rgba(44,95,93,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🚚</div>
                    <div>
                      <p style={{ fontFamily:'monospace', fontSize:12, color:'var(--pine)', fontWeight:600 }}>{s.trackingNumber}</p>
                      <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)', marginTop:1 }}>{s.carrier} · {s.createdBy?.name||'Unknown'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:12, textTransform:'capitalize', color:STATUS_COL[s.status]||'rgba(212,207,196,0.4)', fontWeight:500 }}>{s.status?.replace(/_/g,' ')}</p>
                    <p style={{ fontSize:10, color:'rgba(212,207,196,0.25)', fontFamily:'monospace', marginTop:2 }}>{safe(s.updatedAt,'MMM d, HH:mm')}</p>
                  </div>
                </div>
              ))}
              {(data?.shipments||[]).length===0&&<p style={{ textAlign:'center', color:'rgba(212,207,196,0.3)', padding:'32px 0', fontSize:13 }}>No recent shipments</p>}
            </div>
          </motion.div>

          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <span className="pulse-dot" style={{ background:'#B85C38', width:8, height:8, borderRadius:'50%', display:'inline-block', boxShadow:'0 0 0 3px rgba(184,92,56,0.2)', animation:'pulse-ring 2s infinite' }}/>
              <h3 className="section-title" style={{ marginBottom:0 }}>Recent Requisitions</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {(data?.requisitions||[]).map(r=>(
                <div key={r._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.1)', borderRadius:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:'rgba(184,92,56,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>📝</div>
                    <div>
                      <p style={{ fontFamily:'monospace', fontSize:12, color:'#B85C38', fontWeight:600 }}>{r.reqNumber}</p>
                      <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)', marginTop:1, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:11, textTransform:'capitalize', color:STATUS_COL[r.status]||'rgba(212,207,196,0.4)', fontWeight:500 }}>{r.status}</p>
                    <p style={{ fontSize:10, color:'rgba(212,207,196,0.25)', fontFamily:'monospace', marginTop:2 }}>{safe(r.updatedAt,'MMM d, HH:mm')}</p>
                  </div>
                </div>
              ))}
              {(data?.requisitions||[]).length===0&&<p style={{ textAlign:'center', color:'rgba(212,207,196,0.3)', padding:'32px 0', fontSize:13 }}>No recent requisitions</p>}
            </div>
          </motion.div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
