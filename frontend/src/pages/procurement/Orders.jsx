import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../services/api';
import { StatusBadge, Pagination, Spinner } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import { generatePurchaseOrderPDF } from '../../utils/pdfGenerator';
import { motion } from 'framer-motion';

const safe = (d,fmt) => { try { const {format}=require('date-fns'); return d&&!isNaN(new Date(d))?format(new Date(d),fmt):'—'; } catch{return '—';} };

export default function ProcOrdersPage() {
  const [page,setPage] = useState(1);
  const [status,setStatus] = useState('');
  const {data,isLoading} = useQuery({ queryKey:['proc-orders',page,status], queryFn:()=>orderAPI.getAll({page,limit:10,status}).then(r=>r.data), refetchInterval:15000 });

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Purchase Orders</h1></div></div>
        <select className="select" style={{width:180}} value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>
          <option value="">All Status</option>
          {['draft','pending','approved','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>
      ) : (
        <>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>PO #</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {data?.data?.map((o,i)=>(
                <motion.tr key={o._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                  <td><span style={{fontFamily:'monospace',color:'#C68642',fontSize:12,fontWeight:600}}>{o.orderNumber}</span></td>
                  <td style={{color:'rgba(212,207,196,0.7)'}}>{o.supplier?.name}</td>
                  <td style={{color:'rgba(212,207,196,0.45)'}}>{o.items?.length}</td>
                  <td style={{fontWeight:700,color:'#F8F4EC',fontFamily:'monospace'}}>${o.totalAmount?.toLocaleString()}</td>
                  <td><StatusBadge status={o.status}/></td>
                  <td><StatusBadge status={o.paymentStatus}/></td>
                  <td style={{fontSize:11,color:'rgba(212,207,196,0.3)',fontFamily:'monospace'}}>{safe(o.createdAt,'MMM d, yyyy')}</td>
                  <td>
                    <button onClick={()=>generatePurchaseOrderPDF(o)} className="btn btn-secondary btn-sm" title="Download Official PO PDF">
                      📄 PDF
                    </button>
                  </td>
                </motion.tr>
              ))}
              {data?.data?.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No orders found</td></tr>}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
        </>
      )}
    </PageWrapper>
  );
}
