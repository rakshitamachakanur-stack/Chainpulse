import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptAPI, orderAPI, inventoryAPI } from '../../services/api';
import { Modal, StatusBadge, Pagination, Spinner } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import KpiCard from '../../components/animations/KpiCard';
import { generateGoodsReceiptPDF } from '../../utils/pdfGenerator';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const safe=(d,fmt)=>{try{const{format}=require('date-fns');return d&&!isNaN(new Date(d))?format(new Date(d),fmt):'—';}catch{return '—';} };

// ─────────────────────────────────────────────────────────
//  GOODS RECEIVING PAGE
// ─────────────────────────────────────────────────────────
export function ReceivingPage() {
  const qc = useQueryClient();
  const [page,setPage]=useState(1);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({order:'',notes:'',items:[]});

  const {data,isLoading}=useQuery({queryKey:['receipts',page],queryFn:()=>receiptAPI.getAll({page,limit:10}).then(r=>r.data)});
  const {data:ordData}=useQuery({queryKey:['orders-for-receipt'],queryFn:()=>orderAPI.getAll({limit:100,status:'shipped'}).then(r=>r.data)});

  const verifyMut=useMutation({
    mutationFn:receiptAPI.verify,
    onSuccess:()=>{
      qc.invalidateQueries(['receipts']);
      qc.invalidateQueries(['inventory']);
      qc.invalidateQueries(['low-stock']);
      qc.invalidateQueries(['analytics-dashboard']);
      qc.invalidateQueries(['mgr-inventory']);
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['mgr-orders']);
      qc.invalidateQueries(['orders-dispatch']);
      qc.invalidateQueries(['admin-stats']);
      qc.invalidateQueries(['admin-activity']);
      toast.success('Goods verified! Inventory updated.');
    },
    onError: err => toast.error(err.response?.data?.message || 'Verification failed'),
  });

  const createMut=useMutation({
    mutationFn:receiptAPI.create,
    onSuccess:()=>{
      qc.invalidateQueries(['receipts']);
      toast.success('GRN created');
      setModal(null);
      setForm({order:'',notes:'',items:[]});
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to create GRN'),
  });

  const onOrderChange=(orderId)=>{
    const order=ordData?.data?.find(o=>o._id===orderId);
    if(order){
      const items=order.items.map(i=>({
        product:i.product?._id||i.product,
        orderedQty:i.quantity,
        receivedQty:i.quantity,
        rejectedQty:0,
        condition:'good'
      }));
      // Store supplier from order so we can pass it to the GRN
      setForm(p=>({...p,order:orderId,items,supplier:order.supplier?._id||order.supplier}));
    } else {
      setForm(p=>({...p,order:orderId,items:[],supplier:''}));
    }
  };

  const handleGRNSubmit = () => {
    if (!form.order) {
      toast.error('Please select a shipped order');
      return;
    }
    if (form.items.length === 0) {
      toast.error('Selected order has no items');
      return;
    }

    const payload = {
      order: form.order,
      notes: form.notes,
      items: form.items,
    };
    // Only include supplier if it exists (it's optional on the model)
    if (form.supplier) payload.supplier = form.supplier;

    createMut.mutate(payload);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Goods Receiving</h1></div></div>
        <button onClick={()=>{setForm({order:'',notes:'',items:[]});setModal('create');}} className="btn btn-success">+ New GRN</button>
      </div>

      {isLoading?(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>
      ):(
        <>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>GRN #</th><th>Order</th><th>Supplier</th><th>Received Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data?.data?.map((r,i)=>(
                <motion.tr key={r._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                  <td><span style={{fontFamily:'monospace',color:'#7FC4BF',fontSize:12,fontWeight:600}}>{r.grnNumber}</span></td>
                  <td style={{fontFamily:'monospace',fontSize:11,color:'rgba(212,207,196,0.4)'}}>{r.order?.orderNumber||'—'}</td>
                  <td style={{color:'rgba(212,207,196,0.7)'}}>{r.supplier?.name||'—'}</td>
                  <td style={{fontSize:11,color:'rgba(212,207,196,0.35)',fontFamily:'monospace'}}>{safe(r.receivedDate,'MMM d, yyyy')}</td>
                  <td><StatusBadge status={r.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>generateGoodsReceiptPDF(r)} className="btn btn-secondary btn-sm" title="Download Official GRN PDF">
                        📄 PDF
                      </button>
                      {r.status==='draft'&&(
                        <button onClick={()=>verifyMut.mutate(r._id)} disabled={verifyMut.isPending} className="btn btn-success btn-sm">
                          {verifyMut.isPending?<Spinner size="sm"/>:'Verify & Update Stock'}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {data?.data?.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No receipts found</td></tr>}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
        </>
      )}

      <Modal isOpen={modal==='create'} onClose={()=>setModal(null)} title="New Goods Receipt" size="lg">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label className="label">Linked Order *</label>
            <select className="select" value={form.order} onChange={e=>onOrderChange(e.target.value)}>
              <option value="">Select shipped order…</option>
              {ordData?.data?.map(o=><option key={o._id} value={o._id}>{o.orderNumber} — {o.supplier?.name}</option>)}
            </select>
            {ordData?.data?.length === 0 && (
              <p style={{fontSize:12,color:'rgba(198,134,66,0.7)',marginTop:6}}>
                ⚠ No shipped orders found. Orders must have status "shipped" to create a GRN.
              </p>
            )}
          </div>

          {form.items.length > 0 && (
            <div>
              <label className="label">Items Received</label>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {form.items.map((it,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr 2fr',gap:8,alignItems:'center',padding:'10px 12px',background:'rgba(44,95,93,0.06)',border:'1px solid rgba(94,139,126,0.12)',borderRadius:10}}>
                    <span style={{fontSize:12,color:'rgba(212,207,196,0.55)'}}>Item {i+1} <span style={{color:'rgba(212,207,196,0.3)'}}>(ordered: {it.orderedQty})</span></span>
                    <input
                      className="input" type="number" min="0" placeholder="Received"
                      value={it.receivedQty}
                      onChange={e=>{const items=[...form.items];items[i]={...items[i],receivedQty:+e.target.value};setForm(p=>({...p,items}));}}
                    />
                    <input
                      className="input" type="number" min="0" placeholder="Rejected"
                      value={it.rejectedQty}
                      onChange={e=>{const items=[...form.items];items[i]={...items[i],rejectedQty:+e.target.value};setForm(p=>({...p,items}));}}
                    />
                    <select
                      className="select" value={it.condition}
                      onChange={e=>{const items=[...form.items];items[i]={...items[i],condition:e.target.value};setForm(p=>({...p,items}));}}
                    >
                      {['good','damaged','expired'].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea className="textarea" rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button
              type="button"
              onClick={handleGRNSubmit}
              className="btn btn-success"
              disabled={createMut.isPending || !form.order}
            >
              {createMut.isPending?<Spinner size="sm"/>:'Create GRN'}
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}

// ─────────────────────────────────────────────────────────
//  DISPATCH PAGE
// ─────────────────────────────────────────────────────────
export function DispatchPage() {
  const {data,isLoading}=useQuery({queryKey:['orders-dispatch'],queryFn:()=>orderAPI.getAll({limit:20,status:'approved'}).then(r=>r.data)});
  const safe=(d,fmt)=>{try{const{format}=require('date-fns');return d&&!isNaN(new Date(d))?format(new Date(d),fmt):'—';}catch{return '—';} };
  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">Dispatch</h1></div></div>
      <p style={{color:'rgba(212,207,196,0.4)',fontSize:13,marginBottom:20}}>Orders approved and ready for dispatch to logistics.</p>
      {isLoading?(<div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>):(
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>PO #</th><th>Supplier</th><th>Items</th><th>Total</th><th>Priority</th><th>Expected</th><th>Status</th></tr></thead>
          <tbody>
            {data?.data?.map((o,i)=>(
              <motion.tr key={o._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                <td><span style={{fontFamily:'monospace',color:'#7FC4BF',fontSize:12,fontWeight:600}}>{o.orderNumber}</span></td>
                <td style={{color:'rgba(212,207,196,0.7)'}}>{o.supplier?.name}</td>
                <td style={{color:'rgba(212,207,196,0.45)'}}>{o.items?.length}</td>
                <td style={{fontWeight:700,color:'#F8F4EC',fontFamily:'monospace'}}>${o.totalAmount?.toLocaleString()}</td>
                <td><StatusBadge status={o.priority}/></td>
                <td style={{fontSize:11,color:'rgba(212,207,196,0.35)',fontFamily:'monospace'}}>{safe(o.expectedDelivery,'MMM d, yyyy')}</td>
                <td><StatusBadge status={o.status}/></td>
              </motion.tr>
            ))}
            {data?.data?.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No orders pending dispatch</td></tr>}
          </tbody>
        </table></div>
      )}
    </PageWrapper>
  );
}

// ─────────────────────────────────────────────────────────
//  STOCK TRANSFERS PAGE
// ─────────────────────────────────────────────────────────
export function TransfersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [transfers, setTransfers] = useState([]);

  const { data: invData } = useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => inventoryAPI.getAll({ limit: 200 }).then(r => r.data),
  });

  const [form, setForm] = useState({
    product: '',
    fromLocation: '',
    toLocation: '',
    quantity: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const WAREHOUSES = ['Main Warehouse', 'Secondary Warehouse', 'Cold Storage', 'Overflow Zone', 'Dispatch Bay'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.fromLocation || !form.toLocation || !form.quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.fromLocation === form.toLocation) {
      toast.error('Source and destination must be different');
      return;
    }
    if (Number(form.quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setSubmitting(true);
    await new Promise(res => setTimeout(res, 600));

    const selectedItem = invData?.data?.find(i => i._id === form.product);
    const newTransfer = {
      id: Date.now(),
      transferNumber: `TRF-${String(Date.now()).slice(-6)}`,
      productName: selectedItem?.product?.name || '—',
      sku: selectedItem?.product?.sku || '—',
      fromLocation: form.fromLocation,
      toLocation: form.toLocation,
      quantity: Number(form.quantity),
      notes: form.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTransfers(prev => [newTransfer, ...prev]);
    setSubmitting(false);
    setModal(false);
    setForm({ product: '', fromLocation: '', toLocation: '', quantity: '', notes: '' });
    toast.success(`Transfer ${newTransfer.transferNumber} created!`);
    qc.invalidateQueries(['inventory']);
  };

  const statusColor = (s) => s === 'pending' ? '#C68642' : s === 'completed' ? '#7FC4BF' : '#E08060';

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Stock Transfers</h1></div></div>
        <button className="btn btn-success" onClick={() => setModal(true)}>+ New Transfer</button>
      </div>

      {transfers.length === 0 ? (
        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', padding:'64px 24px' }}>
          <div style={{ fontSize:52, marginBottom:14 }}>🔄</div>
          <p style={{ fontWeight:700, color:'rgba(212,207,196,0.7)', marginBottom:6, fontSize:16 }}>Inter-Warehouse Transfers</p>
          <p style={{ fontSize:13, color:'rgba(212,207,196,0.35)', marginBottom:24 }}>
            Move stock between warehouse locations. Click <strong style={{ color:'#7FC4BF' }}>+ New Transfer</strong> to get started.
          </p>
          <button className="btn btn-success" onClick={() => setModal(true)}>+ New Transfer</button>
        </motion.div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Transfer #</th><th>Product</th><th>SKU</th>
                <th>From</th><th>To</th><th>Qty</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}>
                  <td><span style={{ fontFamily:'monospace', color:'#7FC4BF', fontSize:12, fontWeight:600 }}>{t.transferNumber}</span></td>
                  <td style={{ color:'rgba(212,207,196,0.8)', fontWeight:500 }}>{t.productName}</td>
                  <td style={{ fontFamily:'monospace', fontSize:11, color:'rgba(212,207,196,0.35)' }}>{t.sku}</td>
                  <td style={{ color:'rgba(212,207,196,0.55)', fontSize:12 }}>{t.fromLocation}</td>
                  <td style={{ color:'rgba(212,207,196,0.55)', fontSize:12 }}>{t.toLocation}</td>
                  <td style={{ fontWeight:700, fontFamily:'monospace', color:'#F8F4EC' }}>{t.quantity}</td>
                  <td>
                    <span style={{ fontSize:11, fontWeight:600, color:statusColor(t.status), background:`${statusColor(t.status)}18`, padding:'3px 10px', borderRadius:6, border:`1px solid ${statusColor(t.status)}30` }}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize:11, color:'rgba(212,207,196,0.35)', fontFamily:'monospace' }}>
                    {safe(t.createdAt, 'MMM d, yyyy')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Stock Transfer" size="md">
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Product *</label>
            <select className="select" required value={form.product} onChange={e => setForm(p => ({ ...p, product: e.target.value }))}>
              <option value="">Select inventory item…</option>
              {invData?.data?.map(i => (
                <option key={i._id} value={i._id}>
                  {i.product?.name} — Qty: {i.quantity} ({i.product?.sku})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label className="label">From Location *</label>
              <select className="select" required value={form.fromLocation} onChange={e => setForm(p => ({ ...p, fromLocation: e.target.value }))}>
                <option value="">Select source…</option>
                {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="label">To Location *</label>
              <select className="select" required value={form.toLocation} onChange={e => setForm(p => ({ ...p, toLocation: e.target.value }))}>
                <option value="">Select destination…</option>
                {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Quantity to Transfer *</label>
            <input className="input" type="number" min="1" required placeholder="Enter quantity" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}/>
          </div>
          <div>
            <label className="label">Notes / Reason</label>
            <textarea className="textarea" rows={2} placeholder="Optional — reason for transfer, urgency, etc." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}/>
          </div>
          <div style={{ background:'rgba(44,95,93,0.08)', border:'1px solid rgba(44,95,93,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'rgba(212,207,196,0.5)' }}>
            ℹ️ Transfer will be logged as <strong style={{ color:'#C68642' }}>Pending</strong>. Connect to multi-warehouse backend to auto-deduct stock.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Create Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}

// ─────────────────────────────────────────────────────────
//  WAREHOUSE REPORTS PAGE
// ─────────────────────────────────────────────────────────
export function WhReportsPage() {
  const {data:invData}=useQuery({queryKey:['inventory','all'],queryFn:()=>inventoryAPI.getAll({limit:200}).then(r=>r.data)});
  const totalValue=invData?.data?.reduce((s,i)=>s+(i.quantity*(i.product?.unitPrice||0)),0)||0;
  const statusCounts=['in_stock','low_stock','out_of_stock','overstock'].map(s=>({status:s,count:invData?.data?.filter(i=>i.status===s).length||0}));
  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">Warehouse Reports</h1></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:28}}>
        <KpiCard index={0} icon="💰" label="Inventory Value" value={Math.round(totalValue/1000)} prefix="$" suffix="K" color="copper"/>
        {statusCounts.map((s,i)=><KpiCard key={s.status} index={i+1} icon={['✅','⚠️','❌','📦'][i]} label={s.status.replace(/_/g,' ')} value={s.count} color={['forest','copper','brick','pine'][i]}/>)}
      </div>
      <div className="card">
        <h3 className="section-title">Inventory Breakdown</h3>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Reorder@</th><th>Est. Value</th><th>Status</th></tr></thead>
          <tbody>
            {invData?.data?.slice(0,20).map(i=>(
              <tr key={i._id}>
                <td style={{fontWeight:500,color:'rgba(212,207,196,0.8)'}}>{i.product?.name}</td>
                <td style={{fontFamily:'monospace',fontSize:11,color:'rgba(212,207,196,0.35)'}}>{i.product?.sku}</td>
                <td style={{fontWeight:700,color:'#F8F4EC',fontFamily:'monospace'}}>{i.quantity}</td>
                <td style={{color:'rgba(212,207,196,0.45)'}}>{i.reorderPoint}</td>
                <td style={{color:'#C68642',fontFamily:'monospace'}}>${(i.quantity*(i.product?.unitPrice||0)).toFixed(2)}</td>
                <td><StatusBadge status={i.status}/></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </PageWrapper>
  );
}

export default ReceivingPage;
