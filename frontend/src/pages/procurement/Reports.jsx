import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { requisitionAPI, orderAPI, supplierAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageWrapper from '../../components/animations/PageWrapper';
import KpiCard, { KpiCardSkeleton } from '../../components/animations/KpiCard';
import { motion } from 'framer-motion';

const PALETTE = ['#2C5F5D','#C68642','#7AAE8E','#B85C38','#5E8B7E','#D4944E'];
const TT = { contentStyle:{ background:'rgba(14,22,18,0.95)', border:'1px solid rgba(94,139,126,0.2)', borderRadius:10, color:'#F8F4EC', fontSize:12 } };

export default function ProcReportsPage() {
  const {data:reqData} = useQuery({ queryKey:['requisitions','all'], queryFn:()=>requisitionAPI.getAll({limit:100}).then(r=>r.data) });
  const {data:ordData} = useQuery({ queryKey:['orders','all'], queryFn:()=>orderAPI.getAll({limit:100}).then(r=>r.data) });
  const {data:suppData} = useQuery({ queryKey:['suppliers-list'], queryFn:()=>supplierAPI.getAll({limit:100}).then(r=>r.data) });

  const reqByStatus = ['draft','pending','approved','rejected','converted'].map(s=>({ name:s, value:reqData?.data?.filter(r=>r.status===s).length||0 })).filter(x=>x.value>0);
  const orderByStatus = ['pending','approved','processing','shipped','delivered','cancelled'].map(s=>({ name:s, value:ordData?.data?.filter(o=>o.status===s).length||0 })).filter(x=>x.value>0);
  const topSuppliers = suppData?.data?.slice(0,5).map(s=>({ name:s.name.split(' ')[0], orders:ordData?.data?.filter(o=>o.supplier?._id===s._id||o.supplier===s._id).length||0 }))||[];
  const totalSpend = ordData?.data?.filter(o=>!['cancelled'].includes(o.status)).reduce((s,o)=>s+o.totalAmount,0)||0;
  const totalReqs = reqData?.total||0;
  const approved = reqData?.data?.filter(r=>r.status==='approved').length||0;
  const approvalRate = totalReqs ? Math.round((approved/totalReqs)*100) : 0;

  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">Procurement Reports</h1></div></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:32}}>
        <KpiCard index={0} icon="💰" label="Total Spend"      value={Math.round(totalSpend/1000)} prefix="$" suffix="K" color="copper"/>
        <KpiCard index={1} icon="📝" label="Total Reqs"       value={totalReqs}    color="forest"/>
        <KpiCard index={2} icon="✅" label="Approval Rate"    value={approvalRate} suffix="%"     color="pine"/>
        <KpiCard index={3} icon="🏭" label="Active Suppliers" value={suppData?.data?.filter(s=>s.status==='active').length||0} color="sage"/>
      </div>

      <div className="copper-divider"/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <motion.div className="card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
          <h3 className="section-title">Requisitions by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={reqByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
              {reqByStatus.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
            </Pie><Tooltip {...TT}/><Legend iconSize={8} formatter={v=><span style={{color:'rgba(212,207,196,0.45)',fontSize:11}}>{v}</span>}/></PieChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div className="card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.36}}>
          <h3 className="section-title">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={orderByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
              {orderByStatus.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
            </Pie><Tooltip {...TT}/><Legend iconSize={8} formatter={v=><span style={{color:'rgba(212,207,196,0.45)',fontSize:11}}>{v}</span>}/></PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div className="card" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4}}>
        <h3 className="section-title">Orders per Supplier</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={topSuppliers}><CartesianGrid strokeDasharray="3 3" stroke="rgba(94,139,126,0.1)"/>
            <XAxis dataKey="name" stroke="rgba(212,207,196,0.2)" tick={{fontSize:11,fill:'rgba(212,207,196,0.35)'}}/>
            <YAxis stroke="rgba(212,207,196,0.2)" tick={{fontSize:11,fill:'rgba(212,207,196,0.35)'}}/>
            <Tooltip {...TT}/>
            <Bar dataKey="orders" fill="#C68642" radius={[6,6,0,0]} opacity={0.85}/>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </PageWrapper>
  );
}
