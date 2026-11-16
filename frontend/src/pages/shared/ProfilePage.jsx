import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ROLE_COL = { manager:'#B85C38', procurement:'#C68642', warehouse:'#2C5F5D', logistics:'#7AAE8E' };

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [pf, setPf] = useState({ name:user?.name||'', phone:user?.phone||'', department:user?.department||'' });
  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });

  const pfMut = useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: r => { updateUser(r.data.data); toast.success('Profile updated'); },
    onError: e => toast.error(e.response?.data?.message||'Error'),
  });
  const pwMut = useMutation({
    mutationFn: authAPI.updatePassword,
    onSuccess: r => { localStorage.setItem('cp_token', r.data.token); toast.success('Password changed'); setPw({ currentPassword:'', newPassword:'', confirmPassword:'' }); },
    onError: e => toast.error(e.response?.data?.message||'Error'),
  });

  const handlePw = e => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) return toast.error('Passwords do not match');
    if (pw.newPassword.length < 6) return toast.error('Min 6 characters');
    pwMut.mutate({ currentPassword:pw.currentPassword, newPassword:pw.newPassword });
  };

  const col = ROLE_COL[user?.role] || '#C68642';

  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">My Profile</h1></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
        {/* Avatar card */}
        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'36px 24px' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:`${col}22`, border:`2px solid ${col}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, fontWeight:800, color:col, marginBottom:16 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#F8F4EC', marginBottom:4 }}>{user?.name}</h2>
          <p style={{ fontSize:13, color:'rgba(212,207,196,0.4)', marginBottom:8 }}>{user?.email}</p>
          <span style={{ padding:'3px 12px', borderRadius:999, fontSize:12, fontWeight:600, background:`${col}18`, color:col, border:`1px solid ${col}30`, textTransform:'capitalize' }}>{user?.role}</span>
          <div style={{ width:'100%', marginTop:20, display:'flex', flexDirection:'column', gap:8 }}>
            {[['Department', user?.department||'—'], ['Phone', user?.phone||'—']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 14px', background:'rgba(44,95,93,0.08)', border:'1px solid rgba(94,139,126,0.12)', borderRadius:10 }}>
                <span style={{ fontSize:12, color:'rgba(212,207,196,0.4)' }}>{k}</span>
                <span style={{ fontSize:12, color:'rgba(212,207,196,0.7)', fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 14px', background:'rgba(44,95,93,0.08)', border:'1px solid rgba(94,139,126,0.12)', borderRadius:10 }}>
              <span style={{ fontSize:12, color:'rgba(212,207,196,0.4)' }}>Status</span>
              <span style={{ fontSize:12, fontWeight:600, color:'#7AAE8E' }}>● Active</span>
            </div>
          </div>
        </motion.div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Edit Profile */}
          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}>
            <h3 className="section-title">Edit Profile</h3>
            <form onSubmit={e=>{ e.preventDefault(); pfMut.mutate(pf); }} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}><label className="label">Full Name</label><input className="input" value={pf.name} onChange={e=>setPf(p=>({...p,name:e.target.value}))}/></div>
              <div><label className="label">Phone</label><input className="input" value={pf.phone} onChange={e=>setPf(p=>({...p,phone:e.target.value}))}/></div>
              <div><label className="label">Department</label><input className="input" value={pf.department} onChange={e=>setPf(p=>({...p,department:e.target.value}))}/></div>
              <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={pfMut.isPending}>{pfMut.isPending?<Spinner size="sm"/>:'Save Changes'}</button>
              </div>
            </form>
          </motion.div>

          {/* Change Password */}
          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}>
            <h3 className="section-title">Change Password</h3>
            <form onSubmit={handlePw} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div><label className="label">Current Password</label><input className="input" type="password" value={pw.currentPassword} onChange={e=>setPw(p=>({...p,currentPassword:e.target.value}))} required/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><label className="label">New Password</label><input className="input" type="password" value={pw.newPassword} onChange={e=>setPw(p=>({...p,newPassword:e.target.value}))} required/></div>
                <div><label className="label">Confirm</label><input className="input" type="password" value={pw.confirmPassword} onChange={e=>setPw(p=>({...p,confirmPassword:e.target.value}))} required/></div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={pwMut.isPending}>{pwMut.isPending?<Spinner size="sm"/>:'Change Password'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
