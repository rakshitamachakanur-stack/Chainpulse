import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { Spinner, StatusBadge } from '../../components/common/index.jsx';
import { format } from 'date-fns';
import KpiCard, { KpiCardSkeleton } from '../../components/animations/KpiCard';
import PageWrapper from '../../components/animations/PageWrapper';
import { motion } from 'framer-motion';

export default function ProcDashboard() {
  const { data, isLoading } = useQuery({ queryKey:['analytics-dashboard'], queryFn:()=>analyticsAPI.dashboard().then(r=>r.data.data), refetchInterval:15000 });
  const kpis = data?.kpis || {};
  const recentReqs = data?.recentReqs || [];

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <div className="section-accent"><h1 className="page-title">Procurement Dashboard</h1></div>
          <p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>{format(new Date(),'EEEE, MMM d yyyy')}</p>
        </div>
        <Link to="/requisitions" className="btn btn-primary">+ New Requisition</Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        {isLoading ? [0,1,2,3].map(i=><KpiCardSkeleton key={i} index={i}/>)  : <>
          <KpiCard index={0} icon="📝" label="My Requisitions"  value={kpis.myReqs||0}          color="copper" />
          <KpiCard index={1} icon="⏳" label="Pending Approval" value={kpis.pendingApproval||0} color="brick"  delta={kpis.pendingApproval>0?kpis.pendingApproval:null} deltaUp={false} />
          <KpiCard index={2} icon="✅" label="Approved"         value={kpis.approvedReqs||0}    color="forest" />
          <KpiCard index={3} icon="💰" label="Total Spend"      value={Math.round((kpis.totalSpend||0)/1000)} prefix="$" suffix="K" color="pine" />
        </>}
      </div>

      <div className="copper-divider" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 className="section-title" style={{ marginBottom:0 }}>Recent Requisitions</h3>
            <Link to="/requisitions" style={{ fontSize:12, color:'#C68642', textDecoration:'none' }}>View all →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {recentReqs.length===0 && <p style={{ color:'rgba(212,207,196,0.3)', fontSize:13, textAlign:'center', padding:'24px 0' }}>No requisitions yet</p>}
            {recentReqs.map((r,i) => (
              <motion.div key={r._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35+i*0.05 }}>
                <Link to={`/requisitions/${r._id}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.12)', borderRadius:10 }}>
                  <div>
                    <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#C68642', fontWeight:600 }}>{r.reqNumber}</p>
                    <p style={{ fontSize:12, color:'rgba(212,207,196,0.45)', marginTop:2 }}>{r.title}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <StatusBadge status={r.status}/>
                    <span style={{ fontSize:13, fontWeight:700, color:'#F8F4EC' }}>${r.totalAmount?.toLocaleString()}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
          <h3 className="section-title">Quick Actions</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{to:'/requisitions',icon:'📝',label:'New Requisition',bg:'rgba(198,134,66,0.1)',border:'rgba(198,134,66,0.2)',col:'#C68642'},
              {to:'/orders',icon:'📋',label:'PO Status',bg:'rgba(44,95,93,0.1)',border:'rgba(44,95,93,0.2)',col:'#7FC4BF'},
              {to:'/suppliers',icon:'🏭',label:'Find Suppliers',bg:'rgba(94,139,126,0.1)',border:'rgba(94,139,126,0.2)',col:'#5E8B7E'},
              {to:'/reports',icon:'📊',label:'Cost Reports',bg:'rgba(184,92,56,0.1)',border:'rgba(184,92,56,0.2)',col:'#E08060'},
            ].map(a=>(
              <Link key={a.to} to={a.to} style={{ background:a.bg, border:`1px solid ${a.border}`, borderRadius:12, padding:16, textAlign:'center', textDecoration:'none', transition:'all 0.2s' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{a.icon}</div>
                <p style={{ fontSize:12, fontWeight:600, color:a.col }}>{a.label}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
