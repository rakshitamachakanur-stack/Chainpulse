import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI, supplierAPI } from '../../services/api';
import { Modal, Pagination, Spinner, ConfirmDialog } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const EMPTY = { name:'', category:'', description:'', unit:'piece', unitPrice:'', supplier:'' };

export default function ProcProductsPage() {
  const qc = useQueryClient();
  const [page,setPage]=useState(1);
  const [filters,setFilters]=useState({search:'',category:''});
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [delId,setDelId]=useState(null);

  const {data,isLoading}=useQuery({ queryKey:['products',page,filters], queryFn:()=>productAPI.getAll({page,limit:10,...filters}).then(r=>r.data) });
  const {data:suppData}=useQuery({ queryKey:['suppliers-list'], queryFn:()=>supplierAPI.getAll({limit:100}).then(r=>r.data) });
  const createMut=useMutation({ mutationFn:productAPI.create, onSuccess:()=>{ qc.invalidateQueries(['products']); qc.invalidateQueries(['products-list']); toast.success('Product created'); setModal(null); }});
  const updateMut=useMutation({ mutationFn:({id,d})=>productAPI.update(id,d), onSuccess:()=>{ qc.invalidateQueries(['products']); qc.invalidateQueries(['products-list']); toast.success('Updated'); setModal(null); }});
  const deleteMut=useMutation({ mutationFn:productAPI.remove, onSuccess:()=>{ qc.invalidateQueries(['products']); qc.invalidateQueries(['products-list']); toast.success('Deleted'); }});

  const openCreate=()=>{setForm(EMPTY);setModal('create');};
  const openEdit=p=>{setForm({name:p.name,category:p.category,description:p.description||'',unit:p.unit,unitPrice:p.unitPrice,supplier:p.supplier?._id||''});setModal({mode:'edit',data:p});};
  const handleSubmit=e=>{e.preventDefault(); if(modal==='create') createMut.mutate(form); else updateMut.mutate({id:modal.data._id,d:form});};

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Products</h1></div></div>
        <button onClick={openCreate} className="btn btn-primary">+ Add Product</button>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <input className="input" style={{width:220}} placeholder="Search name, SKU…" value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))}/>
        <input className="input" style={{width:160}} placeholder="Category…" value={filters.category} onChange={e=>setFilters(p=>({...p,category:e.target.value}))}/>
      </div>

      {isLoading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>
      ) : (
        <>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>Unit Price</th><th>Supplier</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data?.data?.map((p,i)=>(
                <motion.tr key={p._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                  <td><div style={{fontWeight:600,color:'rgba(212,207,196,0.85)'}}>{p.name}</div><div style={{fontSize:10,fontFamily:'monospace',color:'rgba(212,207,196,0.3)',marginTop:2}}>{p.sku}</div></td>
                  <td><span style={{padding:'2px 8px',borderRadius:999,fontSize:11,background:'rgba(44,95,93,0.12)',color:'#5E8B7E',border:'1px solid rgba(44,95,93,0.2)'}}>{p.category}</span></td>
                  <td style={{color:'rgba(212,207,196,0.45)'}}>{p.unit}</td>
                  <td style={{fontWeight:700,color:'#C68642',fontFamily:'monospace'}}>${p.unitPrice?.toFixed(2)}</td>
                  <td style={{color:'rgba(212,207,196,0.5)',fontSize:12}}>{p.supplier?.name||'—'}</td>
                  <td><span style={{padding:'2px 8px',borderRadius:999,fontSize:11,fontWeight:500,background:p.isActive?'rgba(44,95,93,0.18)':'rgba(184,92,56,0.12)',color:p.isActive?'#7AAE8E':'#E08060',border:`1px solid ${p.isActive?'rgba(44,95,93,0.3)':'rgba(184,92,56,0.25)'}`}}>{p.isActive?'Active':'Inactive'}</span></td>
                  <td><div style={{display:'flex',gap:6}}>
                    <button onClick={()=>openEdit(p)} className="btn btn-secondary btn-sm">Edit</button>
                    <button onClick={()=>setDelId(p._id)} className="btn btn-danger btn-sm">Del</button>
                  </div></td>
                </motion.tr>
              ))}
              {data?.data?.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No products found</td></tr>}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
        </>
      )}

      <Modal isOpen={!!modal} onClose={()=>setModal(null)} title={modal==='create'?'Add Product':'Edit Product'}>
        <form onSubmit={handleSubmit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{gridColumn:'1/-1'}}><label className="label">Name *</label><input className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div><label className="label">Category *</label><input className="input" required value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/></div>
          <div><label className="label">Unit</label><select className="select" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}>{['piece','kg','liter','meter','box','pallet'].map(u=><option key={u} value={u}>{u}</option>)}</select></div>
          <div><label className="label">Unit Price ($) *</label><input className="input" type="number" step="0.01" required value={form.unitPrice} onChange={e=>setForm(p=>({...p,unitPrice:+e.target.value}))}/></div>
          <div><label className="label">Supplier</label><select className="select" value={form.supplier} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}><option value="">None</option>{suppData?.data?.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
          <div style={{gridColumn:'1/-1'}}><label className="label">Description</label><textarea className="textarea" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
          <div style={{gridColumn:'1/-1',display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMut.isPending||updateMut.isPending}>{(createMut.isPending||updateMut.isPending)?<Spinner size="sm"/>:(modal==='create'?'Create':'Update')}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>deleteMut.mutate(delId)} title="Delete Product" message="Delete this product permanently?" danger/>
    </PageWrapper>
  );
}
