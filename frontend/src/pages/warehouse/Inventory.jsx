import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI, productAPI } from '../../services/api';
import { Modal, StatusBadge, Pagination, Spinner } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import DemandForecastingPanel from '../../components/common/DemandForecastingPanel';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const EMPTY_ADD = { product:'', quantity:0, reorderPoint:10, reorderQty:50, maxStock:500, location:{aisle:'',shelf:'',bin:''} };

export default function InventoryPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('stock');
  const [page,setPage]=useState(1);
  const [filters,setFilters]=useState({status:'',search:''});
  const [adjModal,setAdjModal]=useState(null);
  const [addModal,setAddModal]=useState(false);
  const [adj,setAdj]=useState({type:'in',quantity:1,reference:'',note:''});
  const [addForm,setAddForm]=useState(EMPTY_ADD);

  const {data,isLoading}=useQuery({queryKey:['inventory',page,filters],queryFn:()=>inventoryAPI.getAll({page,limit:15,...filters}).then(r=>r.data),refetchInterval:15000});
  const {data:prodData}=useQuery({queryKey:['products-list'],queryFn:()=>productAPI.getAll({limit:200}).then(r=>r.data)});

  const adjMut=useMutation({
    mutationFn:({id,d})=>inventoryAPI.adjust(id,d),
    onSuccess:()=>{
      qc.invalidateQueries(['inventory']);
      qc.invalidateQueries(['low-stock']);
      qc.invalidateQueries(['analytics-dashboard']);
      qc.invalidateQueries(['mgr-inventory']);
      toast.success('Stock adjusted');
      setAdjModal(null);
    },
    onError: err => toast.error(err.response?.data?.message || 'Adjustment failed'),
  });

  const addMut=useMutation({
    mutationFn:inventoryAPI.create,
    onSuccess:()=>{
      qc.invalidateQueries(['inventory']);
      toast.success('Item added');
      setAddModal(false);
      setAddForm(EMPTY_ADD);
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add item'),
  });

  const handleAddSubmit = () => {
    if (!addForm.product) {
      toast.error('Please select a product');
      return;
    }
    // Build clean payload — only include location fields that have values
    const payload = {
      product:      addForm.product,
      quantity:     addForm.quantity,
      reorderPoint: addForm.reorderPoint,
      reorderQty:   addForm.reorderQty,
      maxStock:     addForm.maxStock,
      location: {
        aisle: addForm.location.aisle || '',
        shelf: addForm.location.shelf || '',
        bin:   addForm.location.bin   || '',
      },
    };
    addMut.mutate(payload);
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Inventory</h1></div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(20,30,27,0.7)', padding: 4, borderRadius: 10, border: '1px solid rgba(94,139,126,0.18)' }}>
            <button
              onClick={() => setTab('stock')}
              className={`btn btn-sm ${tab === 'stock' ? 'btn-success' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              📦 Stock Overview
            </button>
            <button
              onClick={() => setTab('forecasting')}
              className={`btn btn-sm ${tab === 'forecasting' ? 'btn-success' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              📈 Demand Forecast & Smart Reorder
            </button>
          </div>
          {tab === 'stock' && (
            <button onClick={()=>{setAddForm(EMPTY_ADD);setAddModal(true);}} className="btn btn-success">+ Add Item</button>
          )}
        </div>
      </div>

      {tab === 'forecasting' ? (
        <DemandForecastingPanel />
      ) : (
        <>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:20}}>
            <input className="input" style={{width:220}} placeholder="Search product…" value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))}/>
            <select className="select" style={{width:180}} value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}>
              <option value="">All Status</option>
              {['in_stock','low_stock','out_of_stock','overstock'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>

          {isLoading?(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>
          ):(
            <>
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Product</th><th>Location</th><th>Qty</th><th>Reserved</th><th>Available</th><th>Reorder@</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {data?.data?.map((item,i)=>(
                    <motion.tr key={item._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}} className={item.status==='low_stock'||item.status==='out_of_stock'?'low-stock':''}>
                      <td><div style={{fontWeight:600,color:'rgba(212,207,196,0.85)'}}>{item.product?.name}</div><div style={{fontSize:10,fontFamily:'monospace',color:'rgba(212,207,196,0.3)',marginTop:2}}>{item.product?.sku}</div></td>
                      <td style={{fontSize:11,fontFamily:'monospace',color:'rgba(212,207,196,0.4)'}}>{item.location?.aisle}-{item.location?.shelf}-{item.location?.bin}</td>
                      <td style={{fontWeight:800,color:'#F8F4EC',fontFamily:'monospace',fontSize:17}}>{item.quantity}</td>
                      <td style={{color:'#C68642',fontFamily:'monospace'}}>{item.reserved}</td>
                      <td style={{color:item.available<=0?'#E08060':'#7AAE8E',fontWeight:700,fontFamily:'monospace'}}>{item.available}</td>
                      <td style={{color:'rgba(212,207,196,0.4)'}}>{item.reorderPoint}</td>
                      <td><StatusBadge status={item.status}/></td>
                      <td><button onClick={()=>{setAdjModal(item);setAdj({type:'in',quantity:1,reference:'',note:''}); }} className="btn btn-secondary btn-sm">Adjust</button></td>
                    </motion.tr>
                  ))}
                  {data?.data?.length===0&&<tr><td colSpan={8} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No inventory items</td></tr>}
                </tbody>
              </table></div>
              <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
            </>
          )}
        </>
      )}

      {/* Adjust Modal */}
      <Modal isOpen={!!adjModal} onClose={()=>setAdjModal(null)} title={`Adjust — ${adjModal?.product?.name}`} size="sm">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,textAlign:'center'}}>
            {[['Current',adjModal?.quantity,'#F8F4EC'],['Reserved',adjModal?.reserved,'#C68642'],['Available',adjModal?.available,'#7AAE8E']].map(([l,v,c])=>(
              <div key={l} style={{padding:'12px 8px',background:'rgba(44,95,93,0.08)',border:'1px solid rgba(94,139,126,0.12)',borderRadius:10}}>
                <p style={{fontSize:10,color:'rgba(212,207,196,0.35)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{l}</p>
                <p style={{fontSize:22,fontWeight:700,color:c,fontFamily:'monospace'}}>{v}</p>
              </div>
            ))}
          </div>
          <div><label className="label">Type</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {['in','out','adjustment'].map(t=>(
                <button key={t} type="button" onClick={()=>setAdj(p=>({...p,type:t}))}
                  style={{padding:'8px 0',borderRadius:10,border:`1px solid ${adj.type===t?'rgba(44,95,93,0.4)':'rgba(94,139,126,0.15)'}`,background:adj.type===t?'rgba(44,95,93,0.2)':'rgba(44,95,93,0.06)',color:adj.type===t?'#7FC4BF':'rgba(212,207,196,0.4)',fontSize:12,fontWeight:500,cursor:'pointer',textTransform:'capitalize',fontFamily:'inherit'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Quantity</label><input className="input" type="number" min="1" value={adj.quantity} onChange={e=>setAdj(p=>({...p,quantity:+e.target.value}))}/></div>
          <div><label className="label">Reference</label><input className="input" value={adj.reference} onChange={e=>setAdj(p=>({...p,reference:e.target.value}))} placeholder="GRN or PO number…"/></div>
          <div><label className="label">Note</label><textarea className="textarea" rows={2} value={adj.note} onChange={e=>setAdj(p=>({...p,note:e.target.value}))}/></div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button onClick={()=>setAdjModal(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={()=>adjMut.mutate({id:adjModal._id,d:adj})} className="btn btn-success" disabled={adjMut.isPending}>{adjMut.isPending?<Spinner size="sm"/>:'Apply'}</button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={addModal} onClose={()=>{setAddModal(false);setAddForm(EMPTY_ADD);}} title="Add Inventory Item">
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label className="label">Product *</label>
            <select className="select" value={addForm.product} onChange={e=>setAddForm(p=>({...p,product:e.target.value}))}>
              <option value="">Select product…</option>
              {prodData?.data?.map(p=><option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            <div><label className="label">Initial Qty</label><input className="input" type="number" min="0" value={addForm.quantity} onChange={e=>setAddForm(p=>({...p,quantity:+e.target.value}))}/></div>
            <div><label className="label">Reorder@</label><input className="input" type="number" min="0" value={addForm.reorderPoint} onChange={e=>setAddForm(p=>({...p,reorderPoint:+e.target.value}))}/></div>
            <div><label className="label">Max Stock</label><input className="input" type="number" min="1" value={addForm.maxStock} onChange={e=>setAddForm(p=>({...p,maxStock:+e.target.value}))}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            <div><label className="label">Aisle</label><input className="input" value={addForm.location.aisle} onChange={e=>setAddForm(p=>({...p,location:{...p.location,aisle:e.target.value}}))}/></div>
            <div><label className="label">Shelf</label><input className="input" value={addForm.location.shelf} onChange={e=>setAddForm(p=>({...p,location:{...p.location,shelf:e.target.value}}))}/></div>
            <div><label className="label">Bin</label><input className="input" value={addForm.location.bin} onChange={e=>setAddForm(p=>({...p,location:{...p.location,bin:e.target.value}}))}/></div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button type="button" onClick={()=>{setAddModal(false);setAddForm(EMPTY_ADD);}} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={handleAddSubmit} className="btn btn-success" disabled={addMut.isPending}>
              {addMut.isPending?<Spinner size="sm"/>:'Add'}
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
