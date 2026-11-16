import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAPI } from '../../services/api';
import { Modal, StatusBadge, Pagination, Spinner, ConfirmDialog } from '../../components/common/index.jsx';
import PageWrapper from '../../components/animations/PageWrapper';
import SupplierScorecardsPanel from '../../components/common/SupplierScorecardsPanel';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const EMPTY = { name:'', contactName:'', email:'', phone:'', category:'electronics', status:'active', leadTime:7, paymentTerms:'Net 30', notes:'', address:{city:'',country:''} };

export default function ProcSuppliersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('scorecards');
  const [page,setPage]=useState(1);
  const [filters,setFilters]=useState({search:'',status:'',category:''});
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState(EMPTY);
  const [delId,setDelId]=useState(null);

  const {data,isLoading}=useQuery({ queryKey:['suppliers',page,filters], queryFn:()=>supplierAPI.getAll({page,limit:10,...filters}).then(r=>r.data) });
  const createMut=useMutation({ mutationFn:supplierAPI.create, onSuccess:()=>{ qc.invalidateQueries(['suppliers']); qc.invalidateQueries(['suppliers-list']); qc.invalidateQueries(['analytics-dashboard']); toast.success('Supplier created'); setModal(null); }});
  const updateMut=useMutation({ mutationFn:({id,d})=>supplierAPI.update(id,d), onSuccess:()=>{ qc.invalidateQueries(['suppliers']); qc.invalidateQueries(['suppliers-list']); toast.success('Updated'); setModal(null); }});
  const deleteMut=useMutation({ mutationFn:supplierAPI.remove, onSuccess:()=>{ qc.invalidateQueries(['suppliers']); qc.invalidateQueries(['suppliers-list']); qc.invalidateQueries(['analytics-dashboard']); toast.success('Deleted'); }});

  const openCreate=()=>{setForm(EMPTY);setModal('create');};
  const openEdit=s=>{setForm({name:s.name,contactName:s.contactName,email:s.email,phone:s.phone,category:s.category,status:s.status,leadTime:s.leadTime,paymentTerms:s.paymentTerms,notes:s.notes||'',address:s.address||{}});setModal({mode:'edit',data:s});};
  const handleSubmit=e=>{e.preventDefault(); if(modal==='create') createMut.mutate(form); else updateMut.mutate({id:modal.data._id,d:form});};

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Suppliers</h1></div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(20,30,27,0.7)', padding: 4, borderRadius: 10, border: '1px solid rgba(94,139,126,0.18)' }}>
            <button
              onClick={() => setTab('scorecards')}
              className={`btn btn-sm ${tab === 'scorecards' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              🏆 Performance Scorecards
            </button>
            <button
              onClick={() => setTab('directory')}
              className={`btn btn-sm ${tab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              🏭 Directory
            </button>
          </div>
          {tab === 'directory' && (
            <button onClick={openCreate} className="btn btn-primary">+ Add Supplier</button>
          )}
        </div>
      </div>

      {tab === 'scorecards' ? (
        <SupplierScorecardsPanel />
      ) : (
        <>
          <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:20}}>
            <input className="input" style={{width:220}} placeholder="Search name, code…" value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))}/>
            <select className="select" style={{width:150}} value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}>
              <option value="">All Status</option>{['active','inactive','blacklisted'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select" style={{width:170}} value={filters.category} onChange={e=>setFilters(p=>({...p,category:e.target.value}))}>
              <option value="">All Categories</option>{['electronics','raw_material','packaging','logistics','services'].map(c=><option key={c} value={c}>{c.replace('_',' ')}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>{[0,1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12}}/>)}</div>
          ) : (
            <>
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Supplier</th><th>Category</th><th>Contact</th><th>Lead Time</th><th>Rating</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {data?.data?.map((s,i)=>(
                    <motion.tr key={s._id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}>
                      <td><div style={{fontWeight:600,color:'rgba(212,207,196,0.85)'}}>{s.name}</div><div style={{fontSize:10,fontFamily:'monospace',color:'rgba(212,207,196,0.3)',marginTop:2}}>{s.code}</div></td>
                      <td><span style={{padding:'2px 8px',borderRadius:999,fontSize:11,background:'rgba(44,95,93,0.12)',color:'#5E8B7E',border:'1px solid rgba(44,95,93,0.2)',textTransform:'capitalize'}}>{s.category?.replace('_',' ')}</span></td>
                      <td><div style={{color:'rgba(212,207,196,0.7)',fontSize:13}}>{s.contactName}</div><div style={{fontSize:11,color:'rgba(212,207,196,0.35)'}}>{s.email}</div></td>
                      <td style={{color:'rgba(212,207,196,0.5)'}}>{s.leadTime}d</td>
                      <td style={{color:'#C68642',fontFamily:'monospace'}}>★ {s.rating?.toFixed(1)}</td>
                      <td><StatusBadge status={s.status}/></td>
                      <td><div style={{display:'flex',gap:6}}>
                        <button onClick={()=>openEdit(s)} className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={()=>setDelId(s._id)} className="btn btn-danger btn-sm">Del</button>
                      </div></td>
                    </motion.tr>
                  ))}
                  {data?.data?.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:'40px 0',color:'rgba(212,207,196,0.3)'}}>No suppliers found</td></tr>}
                </tbody>
              </table></div>
              <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
            </>
          )}
        </>
      )}

      <Modal isOpen={!!modal} onClose={()=>setModal(null)} title={modal==='create'?'Add Supplier':'Edit Supplier'} size="lg">
        <form onSubmit={handleSubmit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div><label className="label">Contact Name *</label><input className="input" required value={form.contactName} onChange={e=>setForm(p=>({...p,contactName:e.target.value}))}/></div>
          <div><label className="label">Email *</label><input className="input" type="email" required value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></div>
          <div><label className="label">Phone *</label><input className="input" required value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
          <div><label className="label">Category</label><select className="select" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>{['electronics','raw_material','packaging','logistics','services'].map(c=><option key={c} value={c}>{c.replace('_',' ')}</option>)}</select></div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{['active','inactive','blacklisted'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          <div><label className="label">Lead Time (days)</label><input className="input" type="number" value={form.leadTime} onChange={e=>setForm(p=>({...p,leadTime:+e.target.value}))}/></div>
          <div><label className="label">Payment Terms</label><input className="input" value={form.paymentTerms} onChange={e=>setForm(p=>({...p,paymentTerms:e.target.value}))}/></div>
          <div><label className="label">City</label><input className="input" value={form.address?.city||''} onChange={e=>setForm(p=>({...p,address:{...p.address,city:e.target.value}}))}/></div>
          <div><label className="label">Country</label><input className="input" value={form.address?.country||''} onChange={e=>setForm(p=>({...p,address:{...p.address,country:e.target.value}}))}/></div>
          <div style={{gridColumn:'1/-1'}}><label className="label">Notes</label><textarea className="textarea" rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
          <div style={{gridColumn:'1/-1',display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMut.isPending||updateMut.isPending}>{(createMut.isPending||updateMut.isPending)?<Spinner size="sm"/>:(modal==='create'?'Create':'Update')}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>deleteMut.mutate(delId)} title="Delete Supplier" message="Delete this supplier permanently?" danger/>
    </PageWrapper>
  );
}
