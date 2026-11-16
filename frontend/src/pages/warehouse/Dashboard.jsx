import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, inventoryAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import KpiCard, { KpiCardSkeleton } from '../../components/animations/KpiCard';
import PageWrapper from '../../components/animations/PageWrapper';
import { motion } from 'framer-motion';

export default function WhDashboard() {
  const { data, isLoading } = useQuery({ queryKey:['analytics-dashboard'], queryFn:()=>analyticsAPI.dashboard().then(r=>r.data.data), refetchInterval:15000 });
  const { data: lowData } = useQuery({ queryKey:['low-stock'], queryFn:()=>inventoryAPI.getLow().then(r=>r.data), refetchInterval:15000 });
  const kpis = data?.kpis || {};

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Warehouse Dashboard</h1></div>
          <p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>Stock & Inventory Overview</p>
        </div>
        <Link to="/receiving" className="btn btn-success">+ Receive Goods</Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        {isLoading ? [0,1,2,3].map(i=><KpiCardSkeleton key={i} index={i}/>) : <>
          <KpiCard index={0} icon="📦" label="Total SKUs"    value={kpis.totalItems||0}   color="forest" />
          <KpiCard index={1} icon="✅" label="In Stock"      value={kpis.inStock||0}       color="pine"   />
          <KpiCard index={2} icon="⚠️" label="Low Stock"     value={kpis.lowStock||0}      color="copper" delta={kpis.lowStock>0?'Action needed':null} deltaUp={false} />
          <KpiCard index={3} icon="❌" label="Out of Stock"  value={kpis.outOfStock||0}    color="brick"  />
        </>}
      </div>

      <div className="copper-divider" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <motion.div className={`card ${lowData?.data?.length>0?'low-stock':''}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 className="section-title" style={{ marginBottom:0 }}>⚠️ Low / Out of Stock</h3>
            <Link to="/inventory" style={{ fontSize:12, color:'#2C5F5D', textDecoration:'none' }}>View all →</Link>
          </div>
          {lowData?.data?.length===0 && <div className="empty-state"><span style={{ fontSize:36 }}>✅</span><p>All stock levels OK</p></div>}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {lowData?.data?.slice(0,6).map((item,i)=>(
              <motion.div key={item._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35+i*0.05 }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(184,92,56,0.06)', border:'1px solid rgba(184,92,56,0.14)', borderRadius:10 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'rgba(212,207,196,0.8)' }}>{item.product?.name}</p>
                  <p style={{ fontSize:10, fontFamily:'monospace', color:'rgba(212,207,196,0.35)', marginTop:2 }}>{item.product?.sku}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color:item.quantity===0?'#E08060':'#C68642' }}>{item.quantity}</p>
                  <p style={{ fontSize:10, color:'rgba(212,207,196,0.35)' }}>reorder@{item.reorderPoint}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
          <h3 className="section-title">Quick Actions</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[{to:'/receiving',icon:'📥',label:'Receive Goods',bg:'rgba(44,95,93,0.1)',border:'rgba(44,95,93,0.2)',col:'#7FC4BF'},
              {to:'/inventory',icon:'📦',label:'View Inventory',bg:'rgba(94,139,126,0.1)',border:'rgba(94,139,126,0.2)',col:'#5E8B7E'},
              {to:'/dispatch',icon:'📤',label:'Dispatch',bg:'rgba(198,134,66,0.1)',border:'rgba(198,134,66,0.2)',col:'#C68642'},
              {to:'/transfers',icon:'🔄',label:'Transfers',bg:'rgba(184,92,56,0.1)',border:'rgba(184,92,56,0.2)',col:'#E08060'},
            ].map(a=>(
              <Link key={a.to} to={a.to} style={{ background:a.bg, border:`1px solid ${a.border}`, borderRadius:12, padding:16, textAlign:'center', textDecoration:'none' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{a.icon}</div>
                <p style={{ fontSize:12, fontWeight:600, color:a.col }}>{a.label}</p>
              </Link>
            ))}
          </div>
          {kpis.pendingReceipts>0 && (
            <div style={{ background:'rgba(198,134,66,0.08)', border:'1px solid rgba(198,134,66,0.2)', borderRadius:10, padding:'12px 14px' }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#C68642', marginBottom:4 }}>📋 Pending Receipts</p>
              <p style={{ fontSize:12, color:'rgba(212,207,196,0.55)' }}>{kpis.pendingReceipts} orders awaiting verification</p>
              <Link to="/receiving" style={{ fontSize:11, color:'#C68642', textDecoration:'none', display:'block', marginTop:6 }}>Process now →</Link>
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
