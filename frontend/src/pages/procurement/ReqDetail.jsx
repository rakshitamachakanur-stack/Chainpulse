import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requisitionAPI, supplierAPI } from '../../services/api';
import { StatusBadge, Spinner, Modal } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/animations/PageWrapper';
import toast from 'react-hot-toast';

const safe = (d,fmt) => { try { const {format}=require('date-fns'); return d&&!isNaN(new Date(d))?format(new Date(d),fmt):'—'; } catch{return '—';} };

export default function ReqDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [convertModal, setConvertModal] = useState(false);
  const [suppId, setSuppId] = useState('');

  const { data:req, isLoading } = useQuery({ queryKey:['requisition',id], queryFn:()=>requisitionAPI.getOne(id).then(r=>r.data.data) });
  const { data:suppData } = useQuery({ queryKey:['suppliers-list'], queryFn:()=>supplierAPI.getAll({limit:100}).then(r=>r.data) });

  const submitMut = useMutation({ mutationFn:()=>requisitionAPI.submit(id), onSuccess:()=>{ qc.invalidateQueries(['requisition',id]); qc.invalidateQueries(['requisitions']); qc.invalidateQueries(['pending-reqs']); qc.invalidateQueries(['analytics-dashboard']); toast.success('Submitted for approval'); }});
  const convertMut = useMutation({ mutationFn:()=>requisitionAPI.convertToPO(id,{supplier:suppId}), onSuccess:r=>{ qc.invalidateQueries(['requisition',id]); qc.invalidateQueries(['requisitions']); qc.invalidateQueries(['orders']); qc.invalidateQueries(['proc-orders']); qc.invalidateQueries(['mgr-orders']); qc.invalidateQueries(['analytics-dashboard']); qc.invalidateQueries(['admin-stats']); qc.invalidateQueries(['admin-activity']); qc.invalidateQueries(['admin-orders']); toast.success(`PO ${r.data.data.orderNumber} created!`); setConvertModal(false); navigate('/orders'); }});

  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><Spinner size="lg"/></div>;
  if (!req) return <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(212,207,196,0.4)' }}>Requisition not found</div>;

  return (
    <PageWrapper>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link to="/requisitions" className="btn btn-secondary btn-sm">← Back</Link>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:'monospace', color:'#C68642', fontWeight:700, fontSize:18 }}>{req.reqNumber}</span>
              <StatusBadge status={req.priority}/>
              <StatusBadge status={req.status}/>
            </div>
            <p style={{ fontSize:13, color:'rgba(212,207,196,0.4)', marginTop:2 }}>{req.title}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {req.status==='draft' && <button onClick={()=>submitMut.mutate()} disabled={submitMut.isPending} className="btn btn-primary">{submitMut.isPending?<Spinner size="sm"/>:'Submit for Approval'}</button>}
          {req.status==='approved' && !req.convertedTo && <button onClick={()=>setConvertModal(true)} className="btn btn-success">Convert to PO →</button>}
          {req.convertedTo && <Link to="/orders" className="btn btn-secondary">View PO →</Link>}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Items */}
          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <h3 className="section-title">Requested Items</h3>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>
                {req.items?.map((it,i)=>(
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:'rgba(212,207,196,0.85)' }}>{it.product?.name||'Unknown'}</td>
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'rgba(212,207,196,0.35)' }}>{it.product?.sku}</td>
                    <td style={{ color:'rgba(212,207,196,0.6)' }}>{it.quantity} {it.product?.unit}</td>
                    <td style={{ color:'rgba(212,207,196,0.6)' }}>${it.unitPrice?.toFixed(2)}</td>
                    <td style={{ fontWeight:700, color:'#F8F4EC', fontFamily:'monospace' }}>${it.totalPrice?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop:'2px solid rgba(198,134,66,0.2)' }}>
                  <td colSpan={4} style={{ textAlign:'right', fontWeight:700, color:'rgba(212,207,196,0.6)', padding:'12px 16px' }}>Total</td>
                  <td style={{ fontWeight:800, fontSize:18, color:'#F8F4EC', fontFamily:'monospace', padding:'12px 16px' }}>${req.totalAmount?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table></div>
          </motion.div>

          {/* Timeline */}
          <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}>
            <h3 className="section-title">Timeline</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {req.timeline?.slice().reverse().map((t,i)=>(
                <div key={i} style={{ display:'flex', gap:14 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#C68642', marginTop:3, flexShrink:0 }}/>
                    {i<req.timeline.length-1&&<div style={{ width:1, flex:1, background:'rgba(94,139,126,0.15)', margin:'4px 0' }}/>}
                  </div>
                  <div style={{ paddingBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <StatusBadge status={t.status}/>
                      <span style={{ fontSize:11, color:'rgba(212,207,196,0.3)', fontFamily:'monospace' }}>{safe(t.at,'MMM d, yyyy HH:mm')}</span>
                    </div>
                    {t.note&&<p style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{t.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div style={{ display:'flex', flexDirection:'column', gap:14 }} initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
          <div className="card">
            <h3 className="section-title">Details</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[['Created by',req.createdBy?.name],['Justification',req.justification||'—'],['Needed by',safe(req.neededBy,'MMM d, yyyy')],['Preferred Supplier',req.supplier?.name||'—'],['Approved by',req.approvedBy?.name||'—'],['Approval note',req.approvalNote||'—']].map(([k,v])=>(
                <div key={k}>
                  <p style={{ fontSize:10, color:'rgba(212,207,196,0.3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{k}</p>
                  <p style={{ fontSize:13, color:'rgba(212,207,196,0.7)' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <Modal isOpen={convertModal} onClose={()=>setConvertModal(false)} title="Convert to Purchase Order" size="sm">
        <p style={{ color:'rgba(212,207,196,0.55)', fontSize:13, marginBottom:16 }}>Creates a Purchase Order from this approved requisition.</p>
        <div style={{ marginBottom:16 }}>
          <label className="label">Confirm Supplier *</label>
          <select className="select" value={suppId} onChange={e=>setSuppId(e.target.value)}>
            <option value="">Select supplier…</option>
            {suppData?.data?.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={()=>setConvertModal(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={()=>convertMut.mutate()} disabled={!suppId||convertMut.isPending} className="btn btn-success">{convertMut.isPending?<Spinner size="sm"/>:'Create PO'}</button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
