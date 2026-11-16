import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { requisitionAPI, supplierAPI, productAPI } from '../../services/api';
import { Modal, StatusBadge, Pagination, Spinner, ConfirmDialog } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import DemandForecastingPanel from '../../components/common/DemandForecastingPanel';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const safe = (d,fmt) => { try { const {format}=require('date-fns'); return d&&!isNaN(new Date(d))?format(new Date(d),fmt):'—'; } catch{return '—';} };
const EMPTY = { title:'', priority:'medium', justification:'', neededBy:'', supplier:'', items:[{product:'',quantity:1,unitPrice:0}] };

export default function RequisitionsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('list');
  const [page,setPage] = useState(1);
  const [filters,setFilters] = useState({status:'',priority:''});
  const [modal,setModal] = useState(null);
  const [form,setForm] = useState(EMPTY);
  const [delId,setDelId] = useState(null);

  const {data,isLoading} = useQuery({ queryKey:['requisitions',page,filters], queryFn:()=>requisitionAPI.getAll({page,limit:10,...filters}).then(r=>r.data), refetchInterval:10000 });
  const {data:suppData} = useQuery({ queryKey:['suppliers-list'], queryFn:()=>supplierAPI.getAll({limit:100}).then(r=>r.data) });
  const {data:prodData} = useQuery({ queryKey:['products-list'], queryFn:()=>productAPI.getAll({limit:200}).then(r=>r.data) });

  const createMut = useMutation({
    mutationFn: requisitionAPI.create,
    onSuccess: r => {
      qc.invalidateQueries(['requisitions']);
      qc.invalidateQueries(['analytics-dashboard']);
      toast.success('Requisition created');
      navigate(`/requisitions/${r.data.data._id}`);
    },
    onError: err => {
      toast.error(err.response?.data?.message || 'Failed to create requisition');
    }
  });
  const deleteMut = useMutation({ mutationFn:requisitionAPI.remove, onSuccess:()=>{ qc.invalidateQueries(['requisitions']); qc.invalidateQueries(['analytics-dashboard']); toast.success('Deleted'); }});

  const addItem = () => setForm(p=>({...p,items:[...p.items,{product:'',quantity:1,unitPrice:0}]}));
  const removeItem = i => setForm(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i,field,val) => setForm(p=>{ const items=[...p.items]; items[i]={...items[i],[field]:val}; return {...p,items}; });
  const onProdChange = (i,id) => { const prod=prodData?.data?.find(p=>p._id===id); updateItem(i,'product',id); if(prod) updateItem(i,'unitPrice',prod.unitPrice); };
  const total = form.items.reduce((s,it)=>s+(it.quantity||0)*(it.unitPrice||0),0);

  const handleSubmit = () => {
    // Validate at least one item with a product selected
    const validItems = form.items
      .filter(i => i.product)
      .map(i => ({ ...i, totalPrice: i.quantity * i.unitPrice }));

    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (validItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    // Build payload — omit empty-string supplier so Mongoose doesn't try casting ''
    const payload = {
      title: form.title,
      priority: form.priority,
      justification: form.justification,
      neededBy: form.neededBy || undefined,
      items: validItems,
      totalAmount: total,
    };
    if (form.supplier) payload.supplier = form.supplier;

    createMut.mutate(payload);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Requisitions</h1></div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(20,30,27,0.7)', padding: 4, borderRadius: 10, border: '1px solid rgba(94,139,126,0.18)' }}>
            <button
              onClick={() => setTab('list')}
              className={`btn btn-sm ${tab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              📝 Requisitions
            </button>
            <button
              onClick={() => setTab('forecasting')}
              className={`btn btn-sm ${tab === 'forecasting' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              📈 Demand Forecast & Auto-Order
            </button>
          </div>
          {tab === 'list' && (
            <button onClick={()=>{setForm(EMPTY);setModal('create');}} className="btn btn-primary">+ New Requisition</button>
          )}
        </div>
      </div>

      {tab === 'forecasting' ? (
        <DemandForecastingPanel />
      ) : (
        <>

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <select className="select" style={{width:160}} value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}>
          <option value="">All Status</option>
          {['draft','pending','approved','rejected','converted'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" style={{width:140}} value={filters.priority} onChange={e=>setFilters(p=>({...p,priority:e.target.value}))}>
          <option value="">All Priority</option>
          {['low','medium','high','critical'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>
      ) : (
        <>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>REQ #</th><th>Title</th><th>Items</th><th>Total</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {data?.data?.map((r,i)=>(
                <motion.tr key={r._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                  <td><span style={{fontFamily:'monospace',color:'#C68642',fontSize:12,fontWeight:600}}>{r.reqNumber}</span></td>
                  <td style={{fontWeight:500,color:'rgba(212,207,196,0.8)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</td>
                  <td style={{color:'rgba(212,207,196,0.45)'}}>{r.items?.length}</td>
                  <td style={{fontWeight:700,color:'#F8F4EC',fontFamily:'monospace'}}>${r.totalAmount?.toLocaleString()}</td>
                  <td><StatusBadge status={r.priority}/></td>
                  <td><StatusBadge status={r.status}/></td>
                  <td style={{fontSize:11,color:'rgba(212,207,196,0.3)',fontFamily:'monospace'}}>{safe(r.createdAt,'MMM d, yyyy')}</td>
                  <td><div style={{display:'flex',gap:6}}>
                    <Link to={`/requisitions/${r._id}`} className="btn btn-secondary btn-sm">View</Link>
                    {['draft','rejected'].includes(r.status)&&<button onClick={()=>setDelId(r._id)} className="btn btn-danger btn-sm">Del</button>}
                  </div></td>
                </motion.tr>
              ))}
              {data?.data?.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No requisitions found</td></tr>}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
        </>
      )}
      </>
      )}

      <Modal isOpen={modal==='create'} onClose={()=>setModal(null)} title="New Purchase Requisition" size="xl">
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div style={{gridColumn:'1/-1'}}>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Q1 Electronics Restock"/>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
                {['low','medium','high','critical'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Needed By</label>
              <input className="input" type="date" value={form.neededBy} onChange={e=>setForm(p=>({...p,neededBy:e.target.value}))}/>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label className="label">Preferred Supplier</label>
              <select className="select" value={form.supplier} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}>
                <option value="">Select supplier (optional)</option>
                {suppData?.data?.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label className="label">Justification</label>
              <textarea className="textarea" rows={2} value={form.justification} onChange={e=>setForm(p=>({...p,justification:e.target.value}))} placeholder="Business reason…"/>
            </div>
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <label className="label" style={{marginBottom:0}}>Items *</label>
              <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">+ Add Item</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {form.items.map((it,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'5fr 2fr 2fr 1fr 32px',gap:8,alignItems:'center',padding:'10px 12px',background:'rgba(44,95,93,0.06)',border:'1px solid rgba(94,139,126,0.12)',borderRadius:10}}>
                  <select className="select" value={it.product} onChange={e=>onProdChange(i,e.target.value)}>
                    <option value="">Select product…</option>
                    {prodData?.data?.map(p=><option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <input className="input" type="number" min="1" placeholder="Qty" value={it.quantity} onChange={e=>updateItem(i,'quantity',+e.target.value)}/>
                  <input className="input" type="number" step="0.01" placeholder="Price" value={it.unitPrice} onChange={e=>updateItem(i,'unitPrice',+e.target.value)}/>
                  <span style={{fontSize:12,color:'rgba(212,207,196,0.4)',textAlign:'right',fontFamily:'monospace'}}>${((it.quantity||0)*(it.unitPrice||0)).toFixed(0)}</span>
                  {form.items.length>1&&<button type="button" onClick={()=>removeItem(i)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(184,92,56,0.7)',fontSize:18,lineHeight:1}}>×</button>}
                </div>
              ))}
            </div>
            <div style={{marginTop:10,textAlign:'right',fontSize:16,fontWeight:700,color:'#F8F4EC',fontFamily:'monospace'}}>
              Total: ${total.toLocaleString(undefined,{minimumFractionDigits:2})}
            </div>
          </div>

          <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? <Spinner size="sm"/> : 'Save as Draft'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>deleteMut.mutate(delId)} title="Delete Requisition" message="Are you sure? This cannot be undone." danger/>
    </PageWrapper>
  );
}
