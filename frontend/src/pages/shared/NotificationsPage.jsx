import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../../services/api';
import { StatusBadge } from '../../components/common/index.jsx';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageWrapper from '../../components/animations/PageWrapper';

const safe = (d,fmt) => { try { const { format } = require('date-fns'); return d && !isNaN(new Date(d)) ? format(new Date(d), fmt) : '—'; } catch { return '—'; } };
const TYPE_ICON = { low_stock:'⚠️', order_approved:'✅', order_rejected:'❌', shipment_update:'🚚', delivery_done:'🎯', system:'⚙️', info:'ℹ️' };
const TYPE_COL  = { low_stock:'#C68642', order_approved:'#7AAE8E', order_rejected:'#E08060', shipment_update:'#5E8B7E', delivery_done:'#7FC4BF', system:'rgba(212,207,196,0.5)', info:'#5E8B7E' };

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey:['notifications'], queryFn:()=>notificationAPI.getAll().then(r=>r.data) });
  const readMut    = useMutation({ mutationFn:notificationAPI.markRead,    onSuccess:()=>qc.invalidateQueries(['notifications']) });
  const readAllMut = useMutation({ mutationFn:notificationAPI.markAllRead, onSuccess:()=>{ qc.invalidateQueries(['notifications']); toast.success('All marked as read'); } });

  const notifications = data?.data || [];
  const unread = data?.unread || 0;

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <div className="section-accent"><h1 className="page-title">Notifications</h1></div>
          {unread>0&&<p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>{unread} unread</p>}
        </div>
        {unread>0&&<button onClick={()=>readAllMut.mutate()} className="btn btn-secondary" disabled={readAllMut.isPending}>✓ Mark All Read</button>}
      </div>

      {isLoading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[0,1,2,3].map(i=><div key={i} className="skeleton" style={{ height:72, borderRadius:12 }}/>)}
        </div>
      ) : notifications.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:'64px 0' }}>
          <p style={{ fontSize:48, marginBottom:12 }}>🔔</p>
          <p style={{ color:'rgba(212,207,196,0.4)', fontSize:14 }}>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {notifications.map((n,i) => {
            const isRead = n.readBy?.some(r => String(r.user)===String(n.targetUser));
            const col = TYPE_COL[n.type] || '#5E8B7E';
            return (
              <motion.div key={n._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                onClick={()=>!isRead&&readMut.mutate(n._id)}
                style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px', background:'rgba(14,22,18,0.85)', border:`1px solid ${isRead?'rgba(94,139,126,0.12)':'rgba(94,139,126,0.25)'}`, borderLeft:`3px solid ${isRead?'rgba(94,139,126,0.15)':col}`, borderRadius:12, cursor:isRead?'default':'pointer', transition:'all 0.15s' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${col}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{TYPE_ICON[n.type]||'ℹ️'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <p style={{ fontWeight:600, color:isRead?'rgba(212,207,196,0.6)':'rgba(212,207,196,0.9)', fontSize:14 }}>{n.title}</p>
                    <StatusBadge status={n.priority}/>
                    {!isRead&&<span style={{ width:6, height:6, borderRadius:'50%', background:col, flexShrink:0 }}/>}
                  </div>
                  <p style={{ fontSize:13, color:'rgba(212,207,196,0.45)', marginBottom:4 }}>{n.message}</p>
                  <p style={{ fontSize:11, color:'rgba(212,207,196,0.25)', fontFamily:'monospace' }}>{safe(n.createdAt,'MMM d, yyyy HH:mm')}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
