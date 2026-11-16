import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import NetworkBackground from '../../components/animations/NetworkBackground';
import { CyclingTerminal } from '../../components/animations/TypingTerminal';

const DEMOS = [
  { role:'Manager',     email:'manager@chainpulse.com',     color:'#B85C38', desc:'Approvals & KPIs' },
  { role:'Procurement', email:'procurement@chainpulse.com', color:'#C68642', desc:'POs & Requisitions' },
  { role:'Warehouse',   email:'warehouse@chainpulse.com',   color:'#2C5F5D', desc:'Inventory & Receiving' },
  { role:'Logistics',   email:'logistics@chainpulse.com',   color:'#7AAE8E', desc:'Shipments & Fleet' },
];
const MESSAGES = [
  'Monitoring supply chain operations...',
  'Tracking 3 active shipments...',
  'Stock alert: 2 items below reorder point...',
  'PO-2026-0003 awaiting approval...',
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/dashboard');
    } catch(err) {
      const msg = err.code==='ERR_NETWORK'
        ? 'Cannot reach server — is the backend running on port 5000?'
        : err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#080F0D', overflow:'hidden', position:'relative' }}>
      {/* Network canvas */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}><NetworkBackground /></div>

      {/* Left panel */}
      <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
        className="hidden lg:flex"
        style={{ width:440, flexDirection:'column', justifyContent:'center', padding:'64px 56px', position:'relative', zIndex:1,
          background:'rgba(14,22,18,0.55)', borderRight:'1px solid rgba(94,139,126,0.12)', backdropFilter:'blur(16px)' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#2C5F5D,#C68642)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:22, color:'#F8F4EC' }}>C</div>
          <div>
            <p style={{ fontWeight:800, fontSize:22, color:'#F8F4EC', letterSpacing:'-0.02em' }}>ChainPulse</p>
            <p style={{ fontSize:11, color:'rgba(94,139,126,0.7)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:1 }}>Supply Chain Management</p>
          </div>
        </div>

        {/* Tagline */}
        <h2 style={{ fontSize:32, fontWeight:700, color:'#F8F4EC', lineHeight:1.25, marginBottom:12, letterSpacing:'-0.02em' }}>
          Every shipment.<br/>
          <span style={{ color:'#C68642' }}>Every decision.</span><br/>
          One platform.
        </h2>

        {/* Typing terminal */}
        <div style={{ margin:'24px 0 40px', padding:'12px 16px', background:'rgba(11,18,16,0.6)', borderRadius:10, border:'1px solid rgba(94,139,126,0.15)', fontFamily:'monospace' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            {['#B85C38','#C68642','#2C5F5D'].map((c,i)=><span key={i} style={{ width:8, height:8, borderRadius:'50%', background:c, opacity:0.7 }}/>)}
          </div>
          <span style={{ fontSize:11, color:'rgba(94,139,126,0.6)', fontFamily:'monospace' }}>$ chainpulse --status</span><br/>
          <CyclingTerminal messages={MESSAGES} pause={2000} />
        </div>

        {/* Role pills */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {DEMOS.map(d => (
            <div key={d.role} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9, background:'rgba(44,95,93,0.07)', border:'1px solid rgba(94,139,126,0.1)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:d.color, flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:600, color:'rgba(212,207,196,0.7)' }}>{d.role}</span>
              <span style={{ fontSize:11, color:'rgba(212,207,196,0.35)', marginLeft:'auto' }}>{d.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel - form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', zIndex:1 }}>
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45, delay:0.1, ease:[0.16,1,0.3,1] }}
          style={{ width:'100%', maxWidth:420 }}>

          {/* Mobile logo */}
          <div className="lg:hidden" style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#2C5F5D,#C68642)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:24, color:'#F8F4EC', margin:'0 auto 12px' }}>C</div>
            <p style={{ fontWeight:800, fontSize:20, color:'#F8F4EC' }}>ChainPulse</p>
          </div>

          {/* Card */}
          <div style={{ background:'rgba(14,22,18,0.82)', border:'1px solid rgba(94,139,126,0.2)', borderRadius:20, padding:'36px 32px', backdropFilter:'blur(24px)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#F8F4EC', marginBottom:6, letterSpacing:'-0.01em' }}>Sign In</h2>
            <p style={{ fontSize:13, color:'rgba(212,207,196,0.4)', marginBottom:28 }}>Access your ChainPulse workspace</p>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="you@chainpulse.com"
                  value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required />
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showPass?'text':'password'} placeholder="••••••••"
                    style={{ paddingRight:44 }} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, color:'rgba(212,207,196,0.4)' }}>
                    {showPass?'🙈':'👁️'}
                  </button>
                </div>
              </div>
              <motion.button type="submit" disabled={loading} whileTap={{ scale:0.97 }}
                style={{ marginTop:4, padding:'13px 20px', borderRadius:12, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:700, letterSpacing:'0.02em',
                  background: loading ? 'rgba(198,134,66,0.4)' : 'linear-gradient(135deg,#C68642,#A06E30)',
                  color:'#1A0F05', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(198,134,66,0.25)' }}>
                {loading
                  ? <><div style={{ width:16, height:16, border:'2px solid rgba(26,15,5,0.3)', borderTopColor:'#1A0F05', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Signing in…</>
                  : '🔐 Sign In'}
              </motion.button>
            </form>

            {/* Demo creds */}
            <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(94,139,126,0.12)' }}>
              <p style={{ fontSize:11, color:'rgba(212,207,196,0.3)', marginBottom:10, textAlign:'center', textTransform:'uppercase', letterSpacing:'0.06em' }}>Demo — click to fill</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {DEMOS.map(d => (
                  <button key={d.role} onClick={()=>setForm({email:d.email,password:'User@123'})}
                    style={{ background:'rgba(44,95,93,0.1)', border:`1px solid rgba(94,139,126,0.15)`, borderRadius:10, padding:'10px 12px',
                      cursor:'pointer', textAlign:'left', transition:'all 0.15s ease', fontFamily:'inherit' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(44,95,93,0.2)'; e.currentTarget.style.borderColor=d.color;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(44,95,93,0.1)'; e.currentTarget.style.borderColor='rgba(94,139,126,0.15)';}}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:d.color, flexShrink:0 }} />
                      <span style={{ fontSize:11, fontWeight:700, color:'rgba(212,207,196,0.8)' }}>{d.role}</span>
                    </div>
                    <p style={{ fontSize:10, color:'rgba(212,207,196,0.35)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:'rgba(212,207,196,0.25)', marginTop:20 }}>
            Admin panel → <span style={{ color:'rgba(212,207,196,0.4)' }}>localhost:3001</span>
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
