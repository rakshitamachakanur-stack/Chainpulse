import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, shipmentAPI, vehicleAPI, deliveryAPI, orderAPI } from '../../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { Modal, StatusBadge, Pagination, Spinner } from '../../components/common/index.jsx';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import KpiCard, { KpiCardSkeleton } from '../../components/animations/KpiCard';
import PageWrapper from '../../components/animations/PageWrapper';
import ShipmentTimeline from '../../components/animations/ShipmentTimeline';
import { useLiveDataPulse } from '../../components/animations/useLiveDataPulse';
import LiveShipmentMap from '../../components/common/LiveShipmentMap';
import ShipmentQRModal from '../../components/common/ShipmentQRModal';
import { motion } from 'framer-motion';

export function LogDashboard() {
  const { data, isLoading } = useQuery({ queryKey:['analytics-dashboard'], queryFn:()=>analyticsAPI.dashboard().then(r=>r.data.data), refetchInterval:15000 });
  const { data: rawShipData } = useQuery({ queryKey:['shipments',1,{}], queryFn:()=>shipmentAPI.getAll({page:1,limit:10}).then(r=>r.data), refetchInterval:15000 });
  const { data: liveData, flashId } = useLiveDataPulse(rawShipData?.data||[], 9000, true);
  const kpis = data?.kpis || {};

  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Logistics Dashboard</h1></div>
          <p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>Shipments & Fleet Overview</p>
        </div>
        <Link to="/shipments" className="btn btn-logistics">+ New Shipment</Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        {isLoading ? [0,1,2,3].map(i=><KpiCardSkeleton key={i} index={i}/>) : <>
          <KpiCard index={0} icon="🚚" label="Active Shipments"   value={kpis.active||0}            color="pine"   />
          <KpiCard index={1} icon="✅" label="Delivered (Month)"  value={kpis.delivered||0}          color="forest" />
          <KpiCard index={2} icon="⏰" label="Delayed"            value={kpis.delayed||0}            color="brick"  delta={kpis.delayed>0?'Needs attention':null} deltaUp={false} />
          <KpiCard index={3} icon="🚛" label="Available Vehicles" value={kpis.availableVehicles||0}  color="copper" />
        </>}
      </div>

      <div className="copper-divider" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Live shipments table */}
        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 className="section-title" style={{ marginBottom:0 }}>Live Shipments</h3>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span className="live-dot" />
              <Link to="/shipments" style={{ fontSize:12, color:'#7AAE8E', textDecoration:'none' }}>View all →</Link>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {liveData.slice(0,5).map((s,i)=>(
              <motion.div key={s._id} className={s._id===flashId?'row-updated':''} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35+i*0.05 }}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.12)', borderRadius:10 }}>
                <div>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#7AAE8E', fontWeight:600 }}>{s.trackingNumber}</p>
                  <p style={{ fontSize:11, color:'rgba(212,207,196,0.4)', marginTop:2 }}>{s.carrier} · {s.origin?.city}→{s.destination?.city}</p>
                </div>
                <StatusBadge status={s.status} />
              </motion.div>
            ))}
            {liveData.length===0 && <div className="empty-state"><span style={{ fontSize:36 }}>🚚</span><p>No shipments yet</p></div>}
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
          <h3 className="section-title">Quick Actions</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{to:'/shipments',icon:'📦',label:'Manage Shipments',col:'#7AAE8E',bg:'rgba(122,174,142,0.1)',border:'rgba(122,174,142,0.2)'},
              {to:'/deliveries',icon:'🎯',label:'Deliveries',col:'#5E8B7E',bg:'rgba(94,139,126,0.1)',border:'rgba(94,139,126,0.2)'},
              {to:'/fleet',icon:'🚛',label:'Fleet',col:'#C68642',bg:'rgba(198,134,66,0.1)',border:'rgba(198,134,66,0.2)'},
              {to:'/tracking',icon:'📍',label:'Live Tracking',col:'#7FC4BF',bg:'rgba(44,95,93,0.1)',border:'rgba(44,95,93,0.2)'},
            ].map(a=>(
              <Link key={a.to} to={a.to} style={{ background:a.bg, border:`1px solid ${a.border}`, borderRadius:12, padding:16, textAlign:'center', textDecoration:'none' }}>
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

const SHIP_EMPTY = { order:'', carrier:'', serviceType:'standard', origin:{ city:'', country:'' }, destination:{ city:'', country:'' }, estimatedDelivery:'', weight:'', packages:1, cost:'' };
export function ShipmentsPage() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState('list');
  const [qrModal, setQrModal] = useState(null);
  const [page,setPage]=useState(1);
  const [filters,setFilters]=useState({status:''});
  const [modal,setModal]=useState(null);
  const [viewModal,setViewModal]=useState(null);
  const [statusModal,setStatusModal]=useState(null);
  const [form,setForm]=useState(SHIP_EMPTY);
  const [newStatus,setNewStatus]=useState('');
  const [eventDesc,setEventDesc]=useState('');
  const { data,isLoading } = useQuery({ queryKey:['shipments',page,filters], queryFn:()=>shipmentAPI.getAll({page,limit:10,...filters}).then(r=>r.data), refetchInterval:15000 });
  const { data:ordData } = useQuery({ queryKey:['orders-approved'], queryFn:()=>orderAPI.getAll({limit:100}).then(r=>r.data) });
  const { data:vehData } = useQuery({ queryKey:['vehicles'], queryFn:()=>vehicleAPI.getAll().then(r=>r.data) });
  const createMut = useMutation({ mutationFn:shipmentAPI.create, onSuccess:()=>{ qc.invalidateQueries(['shipments']); qc.invalidateQueries(['shipments-list']); qc.invalidateQueries(['mgr-shipments']); qc.invalidateQueries(['analytics-dashboard']); qc.invalidateQueries(['admin-stats']); qc.invalidateQueries(['admin-activity']); toast.success('Shipment created'); setModal(null); } });
  const updateMut = useMutation({ mutationFn:({id,d})=>shipmentAPI.update(id,d), onSuccess:()=>{ qc.invalidateQueries(['shipments']); qc.invalidateQueries(['mgr-shipments']); qc.invalidateQueries(['analytics-dashboard']); qc.invalidateQueries(['admin-activity']); toast.success('Status updated'); setStatusModal(null); } });
  const deleteMut = useMutation({ mutationFn:shipmentAPI.remove, onSuccess:()=>{ qc.invalidateQueries(['shipments']); toast.success('Deleted'); } });
  const STATUSES = ['preparing','picked_up','in_transit','out_for_delivery','delivered','failed','returned'];
  return (
    <PageWrapper>
      <div className="page-header">
        <div><h1 className="page-title">Shipments</h1></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(20,30,27,0.7)', padding: 4, borderRadius: 10, border: '1px solid rgba(94,139,126,0.18)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-logistics' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              📋 Shipments List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-logistics' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              🗺️ Live Fleet Radar Map
            </button>
          </div>
          <button onClick={()=>{ setForm(SHIP_EMPTY); setModal('create'); }} className="btn btn-logistics">+ New Shipment</button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div style={{ marginBottom: 20 }}>
          <LiveShipmentMap onSelectShipment={(s)=>setViewModal(s)} onOpenQR={(s)=>setQrModal(s)} />
        </div>
      ) : (
        <>
          <div style={{ marginBottom:20 }}>
            <select className="select" style={{ width:200 }} value={filters.status} onChange={e=>setFilters(p=>({...p,status:e.target.value}))}>
              <option value="">All Status</option>{STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          {isLoading ? <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><div style={{ width:32, height:32, border:'2px solid rgba(94,139,126,0.2)', borderTopColor:'#7AAE8E', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/></div> : (
            <>
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Tracking #</th><th>Order</th><th>Carrier</th><th>Route</th><th>ETA</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {data?.data?.map(s=>(
                    <tr key={s._id}>
                      <td><span style={{ fontFamily:'monospace', color:'#7AAE8E', fontSize:12, fontWeight:600 }}>{s.trackingNumber}</span></td>
                      <td style={{ color:'rgba(212,207,196,0.5)', fontSize:12, fontFamily:'monospace' }}>{s.order?.orderNumber||'—'}</td>
                      <td style={{ color:'rgba(212,207,196,0.7)' }}>{s.carrier}</td>
                      <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{s.origin?.city}→{s.destination?.city}</td>
                      <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{s.estimatedDelivery&&!isNaN(new Date(s.estimatedDelivery))?format(new Date(s.estimatedDelivery),'MMM d'):'—'}</td>
                      <td><StatusBadge status={s.status}/></td>
                      <td><div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>setQrModal(s)} className="btn btn-secondary btn-sm" title="Print Shipping Label / QR Code">📱 QR</button>
                        <button onClick={()=>setViewModal(s)} className="btn btn-secondary btn-sm">View</button>
                        <button onClick={()=>{ setStatusModal(s); setNewStatus(s.status); setEventDesc(''); }} className="btn btn-secondary btn-sm">Update</button>
                        <button onClick={()=>{ if(window.confirm('Delete?')) deleteMut.mutate(s._id); }} className="btn btn-danger btn-sm">×</button>
                      </div></td>
                    </tr>
                  ))}
                  {data?.data?.length===0&&<tr><td colSpan={7} style={{ textAlign:'center', padding:'40px 0', color:'rgba(212,207,196,0.3)' }}>No shipments</td></tr>}
                </tbody>
              </table></div>
              <Pagination page={page} pages={data?.pages||1} onPage={setPage}/>
            </>
          )}
        </>
      )}

      {/* QR Modal */}
      <ShipmentQRModal isOpen={!!qrModal} onClose={()=>setQrModal(null)} shipment={qrModal} />
      <Modal isOpen={modal==='create'} onClose={()=>setModal(null)} title="Create Shipment" size="lg">
        <form onSubmit={e=>{ e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="label">Linked Order</label><select className="select" value={form.order} onChange={e=>setForm(p=>({...p,order:e.target.value}))}><option value="">Select order…</option>{ordData?.data?.map(o=><option key={o._id} value={o._id}>{o.orderNumber}</option>)}</select></div>
            <div><label className="label">Vehicle</label><select className="select" value={form.vehicle||''} onChange={e=>setForm(p=>({...p,vehicle:e.target.value}))}><option value="">Select vehicle…</option>{vehData?.data?.filter(v=>v.status==='available').map(v=><option key={v._id} value={v._id}>{v.regNumber} ({v.type})</option>)}</select></div>
            <div><label className="label">Carrier *</label><input className="input" required value={form.carrier} onChange={e=>setForm(p=>({...p,carrier:e.target.value}))} placeholder="FedEx, UPS, DHL…"/></div>
            <div><label className="label">Service</label><select className="select" value={form.serviceType} onChange={e=>setForm(p=>({...p,serviceType:e.target.value}))}>{['standard','express','freight','air','ocean'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="label">Origin City *</label><input className="input" required value={form.origin.city} onChange={e=>setForm(p=>({...p,origin:{...p.origin,city:e.target.value}}))}/></div>
            <div><label className="label">Destination City *</label><input className="input" required value={form.destination.city} onChange={e=>setForm(p=>({...p,destination:{...p.destination,city:e.target.value}}))}/></div>
            <div><label className="label">Est. Delivery</label><input className="input" type="date" value={form.estimatedDelivery} onChange={e=>setForm(p=>({...p,estimatedDelivery:e.target.value}))}/></div>
            <div><label className="label">Weight (kg)</label><input className="input" type="number" step="0.1" value={form.weight} onChange={e=>setForm(p=>({...p,weight:+e.target.value}))}/></div>
            <div><label className="label">Packages</label><input className="input" type="number" min="1" value={form.packages} onChange={e=>setForm(p=>({...p,packages:+e.target.value}))}/></div>
            <div><label className="label">Cost ($)</label><input className="input" type="number" step="0.01" value={form.cost} onChange={e=>setForm(p=>({...p,cost:+e.target.value}))}/></div>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8 }}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-logistics" disabled={createMut.isPending}>{createMut.isPending?<Spinner size="sm"/>:'Create'}</button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={!!viewModal} onClose={()=>setViewModal(null)} title="Shipment Details" size="lg">
        {viewModal&&(
          <div>
            <ShipmentTimeline status={viewModal.status} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
              {[['Tracking',viewModal.trackingNumber],['Carrier',viewModal.carrier],['Service',viewModal.serviceType],['Weight',viewModal.weight?`${viewModal.weight}kg`:'—'],['Packages',viewModal.packages],['Cost',viewModal.cost?`$${viewModal.cost}`:'—']].map(([k,v])=>(
                <div key={k} style={{ background:'rgba(44,95,93,0.08)', border:'1px solid rgba(94,139,126,0.15)', borderRadius:10, padding:'10px 14px' }}>
                  <p style={{ fontSize:10, color:'rgba(212,207,196,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{k}</p>
                  <p style={{ fontSize:13, color:'rgba(212,207,196,0.8)', fontWeight:500, fontFamily:'monospace' }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, marginTop:14 }}>
              <div style={{ flex:1, background:'rgba(44,95,93,0.08)', border:'1px solid rgba(94,139,126,0.15)', borderRadius:10, padding:'10px 14px' }}>
                <p style={{ fontSize:10, color:'rgba(212,207,196,0.35)', textTransform:'uppercase', marginBottom:4 }}>From</p>
                <p style={{ color:'rgba(212,207,196,0.8)', fontWeight:600 }}>{viewModal.origin?.city}, {viewModal.origin?.country}</p>
              </div>
              <div style={{ alignSelf:'center', color:'rgba(198,134,66,0.6)', fontSize:20 }}>→</div>
              <div style={{ flex:1, background:'rgba(44,95,93,0.08)', border:'1px solid rgba(94,139,126,0.15)', borderRadius:10, padding:'10px 14px' }}>
                <p style={{ fontSize:10, color:'rgba(212,207,196,0.35)', textTransform:'uppercase', marginBottom:4 }}>To</p>
                <p style={{ color:'rgba(212,207,196,0.8)', fontWeight:600 }}>{viewModal.destination?.city}, {viewModal.destination?.country}</p>
              </div>
            </div>
            <div style={{ marginTop:16 }}>
              <p style={{ fontSize:12, color:'rgba(212,207,196,0.4)', fontWeight:600, marginBottom:10 }}>Events</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
                {viewModal.events?.slice().reverse().map((ev,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#7AAE8E', marginTop:5, flexShrink:0 }} />
                    <div><p style={{ fontSize:12, color:'rgba(212,207,196,0.7)', fontWeight:500, textTransform:'capitalize' }}>{ev.status?.replace(/_/g,' ')}</p>
                      <p style={{ fontSize:11, color:'rgba(212,207,196,0.35)' }}>{ev.location} · {ev.timestamp&&!isNaN(new Date(ev.timestamp))?format(new Date(ev.timestamp),'MMM d, HH:mm'):'—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal isOpen={!!statusModal} onClose={()=>setStatusModal(null)} title="Update Shipment" size="sm">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label className="label">Status</label><select className="select" value={newStatus} onChange={e=>setNewStatus(e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
          <div><label className="label">Description</label><textarea className="textarea" rows={2} value={eventDesc} onChange={e=>setEventDesc(e.target.value)}/></div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={()=>setStatusModal(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={()=>updateMut.mutate({id:statusModal._id,d:{status:newStatus,eventDescription:eventDesc}})} disabled={updateMut.isPending} className="btn btn-logistics">{updateMut.isPending?<Spinner size="sm"/>:'Update'}</button>
          </div>
        </div>
      </Modal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageWrapper>
  );
}
export function DeliveriesPage() {
  const qc = useQueryClient();
  const [page,setPage]=useState(1);
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({ shipment:'', scheduledDate:'', recipient:{ name:'', phone:'', address:'' }, notes:'' });
  const { data,isLoading } = useQuery({ queryKey:['deliveries',page], queryFn:()=>deliveryAPI.getAll({page,limit:10}).then(r=>r.data), refetchInterval:15000 });
  const { data:shipData } = useQuery({ queryKey:['shipments-list'], queryFn:()=>shipmentAPI.getAll({limit:100}).then(r=>r.data) });
  const createMut = useMutation({ mutationFn:deliveryAPI.create, onSuccess:()=>{ qc.invalidateQueries(['deliveries']); qc.invalidateQueries(['analytics-dashboard']); qc.invalidateQueries(['admin-activity']); toast.success('Delivery scheduled'); setModal(null); } });
  const updateMut = useMutation({ mutationFn:({id,d})=>deliveryAPI.update(id,d), onSuccess:()=>{ qc.invalidateQueries(['deliveries']); qc.invalidateQueries(['analytics-dashboard']); qc.invalidateQueries(['admin-activity']); toast.success('Updated'); } });
  return (
    <PageWrapper>
      <div className="page-header"><h1 className="page-title">Deliveries</h1><button onClick={()=>setModal('create')} className="btn btn-logistics">+ Schedule Delivery</button></div>
      {isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><div style={{ width:32, height:32, border:'2px solid rgba(94,139,126,0.2)', borderTopColor:'#7AAE8E', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/></div>:(
        <><div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Delivery #</th><th>Shipment</th><th>Recipient</th><th>Scheduled</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.data?.map(d=>(
              <tr key={d._id}>
                <td><span style={{ fontFamily:'monospace', color:'#7AAE8E', fontSize:12 }}>{d.deliveryNumber}</span></td>
                <td style={{ fontFamily:'monospace', fontSize:12, color:'rgba(212,207,196,0.45)' }}>{d.shipment?.trackingNumber||'—'}</td>
                <td style={{ color:'rgba(212,207,196,0.7)' }}>{d.recipient?.name||'—'}</td>
                <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{d.scheduledDate&&!isNaN(new Date(d.scheduledDate))?format(new Date(d.scheduledDate),'MMM d, yyyy'):'—'}</td>
                <td><StatusBadge status={d.status}/></td>
                <td><div style={{ display:'flex', gap:6 }}>
                  {d.status==='scheduled'&&<button onClick={()=>updateMut.mutate({id:d._id,d:{status:'dispatched'}})} className="btn btn-logistics btn-sm">Dispatch</button>}
                  {d.status==='dispatched'&&<button onClick={()=>updateMut.mutate({id:d._id,d:{status:'delivered'}})} className="btn btn-success btn-sm">Delivered</button>}
                </div></td>
              </tr>
            ))}
            {data?.data?.length===0&&<tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'rgba(212,207,196,0.3)' }}>No deliveries</td></tr>}
          </tbody>
        </table></div>
        <Pagination page={page} pages={data?.pages||1} onPage={setPage}/></>
      )}
      <Modal isOpen={modal==='create'} onClose={()=>setModal(null)} title="Schedule Delivery">
        <form onSubmit={e=>{ e.preventDefault(); createMut.mutate(form); }} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><label className="label">Shipment *</label><select className="select" required value={form.shipment} onChange={e=>setForm(p=>({...p,shipment:e.target.value}))}><option value="">Select shipment…</option>{shipData?.data?.map(s=><option key={s._id} value={s._id}>{s.trackingNumber}</option>)}</select></div>
          <div><label className="label">Scheduled Date</label><input className="input" type="date" value={form.scheduledDate} onChange={e=>setForm(p=>({...p,scheduledDate:e.target.value}))}/></div>
          <div><label className="label">Recipient Name</label><input className="input" value={form.recipient.name} onChange={e=>setForm(p=>({...p,recipient:{...p.recipient,name:e.target.value}}))}/></div>
          <div><label className="label">Recipient Phone</label><input className="input" value={form.recipient.phone} onChange={e=>setForm(p=>({...p,recipient:{...p.recipient,phone:e.target.value}}))}/></div>
          <div><label className="label">Delivery Address</label><input className="input" value={form.recipient.address} onChange={e=>setForm(p=>({...p,recipient:{...p.recipient,address:e.target.value}}))}/></div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-logistics" disabled={createMut.isPending}>{createMut.isPending?<Spinner size="sm"/>:'Schedule'}</button>
          </div>
        </form>
      </Modal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageWrapper>
  );
}
export function FleetPage() {
  const qc = useQueryClient();
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({ regNumber:'', type:'truck', make:'', model:'', year:'', capacity:'', driver:'', driverPhone:'', fuelType:'diesel' });
  const { data,isLoading } = useQuery({ queryKey:['vehicles'], queryFn:()=>vehicleAPI.getAll().then(r=>r.data) });
  const createMut = useMutation({ mutationFn:vehicleAPI.create, onSuccess:()=>{ qc.invalidateQueries(['vehicles']); toast.success('Vehicle added'); setModal(null); } });
  const updateMut = useMutation({ mutationFn:({id,d})=>vehicleAPI.update(id,d), onSuccess:()=>{ qc.invalidateQueries(['vehicles']); toast.success('Updated'); } });
  const STATUS_STYLE = { available:{bg:'rgba(44,95,93,0.2)',color:'#7FC4BF'}, in_use:{bg:'rgba(94,139,126,0.2)',color:'#5E8B7E'}, maintenance:{bg:'rgba(198,134,66,0.15)',color:'#C68642'}, retired:{bg:'rgba(184,92,56,0.15)',color:'#E08060'} };
  return (
    <PageWrapper>
      <div className="page-header"><h1 className="page-title">Fleet Management</h1><button onClick={()=>setModal('create')} className="btn btn-logistics">+ Add Vehicle</button></div>
      {isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><div style={{ width:32, height:32, border:'2px solid rgba(94,139,126,0.2)', borderTopColor:'#7AAE8E', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/></div>:(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {data?.data?.map((v,i)=>{
            const s=STATUS_STYLE[v.status]||STATUS_STYLE.available;
            return (
              <motion.div key={v._id} className="card" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div><p style={{ fontFamily:'monospace', fontWeight:700, color:'#F8F4EC', fontSize:15 }}>{v.regNumber}</p><p style={{ fontSize:12, color:'rgba(212,207,196,0.45)', marginTop:2, textTransform:'capitalize' }}>{v.type} · {v.make} {v.model}</p></div>
                  <span style={{ padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500, background:s.bg, color:s.color }}>{v.status?.replace('_',' ')}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12, marginBottom:14 }}>
                  {v.driver&&<div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'rgba(212,207,196,0.35)' }}>Driver</span><span style={{ color:'rgba(212,207,196,0.7)' }}>{v.driver}</span></div>}
                  {v.capacity&&<div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'rgba(212,207,196,0.35)' }}>Capacity</span><span style={{ color:'rgba(212,207,196,0.7)' }}>{v.capacity}kg</span></div>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {v.status==='available'&&<button onClick={()=>updateMut.mutate({id:v._id,d:{status:'in_use'}})} className="btn btn-logistics btn-sm" style={{ flex:1 }}>Assign</button>}
                  {v.status==='in_use'&&<button onClick={()=>updateMut.mutate({id:v._id,d:{status:'available'}})} className="btn btn-success btn-sm" style={{ flex:1 }}>Return</button>}
                  {v.status!=='maintenance'&&<button onClick={()=>updateMut.mutate({id:v._id,d:{status:'maintenance'}})} className="btn btn-warning btn-sm">Service</button>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <Modal isOpen={modal==='create'} onClose={()=>setModal(null)} title="Add Vehicle">
        <form onSubmit={e=>{ e.preventDefault(); createMut.mutate(form); }} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><label className="label">Reg Number *</label><input className="input" required value={form.regNumber} onChange={e=>setForm(p=>({...p,regNumber:e.target.value}))}/></div>
          <div><label className="label">Type</label><select className="select" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>{['truck','van','motorcycle','ship','plane'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="label">Make</label><input className="input" value={form.make} onChange={e=>setForm(p=>({...p,make:e.target.value}))}/></div>
          <div><label className="label">Model</label><input className="input" value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value}))}/></div>
          <div><label className="label">Year</label><input className="input" type="number" value={form.year} onChange={e=>setForm(p=>({...p,year:+e.target.value}))}/></div>
          <div><label className="label">Capacity (kg)</label><input className="input" type="number" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:+e.target.value}))}/></div>
          <div><label className="label">Driver</label><input className="input" value={form.driver} onChange={e=>setForm(p=>({...p,driver:e.target.value}))}/></div>
          <div><label className="label">Driver Phone</label><input className="input" value={form.driverPhone} onChange={e=>setForm(p=>({...p,driverPhone:e.target.value}))}/></div>
          <div><label className="label">Fuel</label><select className="select" value={form.fuelType} onChange={e=>setForm(p=>({...p,fuelType:e.target.value}))}>{['petrol','diesel','electric','hybrid'].map(f=><option key={f} value={f}>{f}</option>)}</select></div>
          <div style={{ gridColumn:'1/-1', display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={()=>setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-logistics" disabled={createMut.isPending}>{createMut.isPending?<Spinner size="sm"/>:'Add'}</button>
          </div>
        </form>
      </Modal>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </PageWrapper>
  );
}
export function TrackingPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tn') ? 'lookup' : 'radar');
  const [tn, setTn] = useState(searchParams.get('tn') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState(null);

  const track = async (queryNumber) => {
    const num = (queryNumber || tn).trim();
    if (!num) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await shipmentAPI.track(num);
      setResult(r.data.data);
      setTab('lookup');
    } catch (e) {
      setError(e.response?.data?.message || 'Tracking number not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramTn = searchParams.get('tn');
    if (paramTn) {
      setTn(paramTn);
      track(paramTn);
    }
  }, [searchParams]);

  return (
    <PageWrapper>
      <div className="page-header">
        <div><h1 className="page-title">Live Tracking & Fleet Radar</h1></div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(20,30,27,0.7)', padding: 4, borderRadius: 10, border: '1px solid rgba(94,139,126,0.18)' }}>
          <button
            onClick={() => setTab('radar')}
            className={`btn btn-sm ${tab === 'radar' ? 'btn-logistics' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            🗺️ Live Fleet Radar Map
          </button>
          <button
            onClick={() => setTab('lookup')}
            className={`btn btn-sm ${tab === 'lookup' ? 'btn-logistics' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            🔍 Number Lookup
          </button>
        </div>
      </div>

      {tab === 'radar' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LiveShipmentMap
            onSelectShipment={(s) => {
              setTn(s.trackingNumber);
              track(s.trackingNumber);
            }}
            onOpenQR={(s) => setQrModal(s)}
          />
        </div>
      ) : (
        <>
          <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Enter tracking number e.g. CP-FEDEX-001, CP-UPS-002…"
                value={tn}
                onChange={e => setTn(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && track()}
              />
              <button onClick={() => track()} disabled={loading} className="btn btn-logistics" style={{ padding: '10px 20px' }}>
                {loading ? <Spinner size="sm" /> : '🔍 Track'}
              </button>
            </div>
            {error && <p style={{ color: '#E08060', fontSize: 13, marginTop: 10 }}>{error}</p>}
          </div>

          {result && (
            <motion.div className="card" style={{ maxWidth: 640 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'rgba(212,207,196,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tracking Number</p>
                  <p style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#7AAE8E' }}>{result.trackingNumber}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setQrModal(result)} className="btn btn-secondary btn-sm" title="Print Shipping Label or QR">
                    📱 QR Label
                  </button>
                  <StatusBadge status={result.status} />
                </div>
              </div>

              <ShipmentTimeline status={result.status} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '16px 0' }}>
                {[
                  ['Carrier', `${result.carrier} (${result.serviceType || 'Standard'})`],
                  ['Current Loc', `${result.currentLocation?.city || result.origin?.city || 'In Transit'}, ${result.currentLocation?.country || 'USA'}`],
                  ['Route', `${result.origin?.city} → ${result.destination?.city}`],
                  ['ETA', result.estimatedDelivery && !isNaN(new Date(result.estimatedDelivery)) ? format(new Date(result.estimatedDelivery), 'MMM d, yyyy') : '—']
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(44,95,93,0.08)', border: '1px solid rgba(94,139,126,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 10, color: 'rgba(212,207,196,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>{k}</p>
                    <p style={{ fontSize: 13, color: 'rgba(212,207,196,0.85)', fontWeight: 600 }}>{v}</p>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: 12, color: 'rgba(212,207,196,0.4)', fontWeight: 600, marginBottom: 8 }}>Milestone Events</p>
                {result.events?.slice().reverse().map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7AAE8E', marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, color: 'rgba(212,207,196,0.7)', fontWeight: 500, textTransform: 'capitalize' }}>{ev.status?.replace(/_/g, ' ')}</p>
                      <p style={{ fontSize: 11, color: 'rgba(212,207,196,0.35)' }}>{ev.location} · {ev.timestamp && !isNaN(new Date(ev.timestamp)) ? format(new Date(ev.timestamp), 'MMM d, HH:mm') : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* QR Modal */}
      <ShipmentQRModal isOpen={!!qrModal} onClose={() => setQrModal(null)} shipment={qrModal} />
    </PageWrapper>
  );
}
export function LogReportsPage() {
  const { data:shipData } = useQuery({ queryKey:['shipments','all'], queryFn:()=>shipmentAPI.getAll({limit:100}).then(r=>r.data) });
  const { data:vehData }  = useQuery({ queryKey:['vehicles'], queryFn:()=>vehicleAPI.getAll().then(r=>r.data) });
  const delivered=shipData?.data?.filter(s=>s.status==='delivered').length||0;
  const inTransit=shipData?.data?.filter(s=>s.status==='in_transit').length||0;
  const totalCost=shipData?.data?.reduce((s,sh)=>s+(sh.cost||0),0)||0;
  return (
    <PageWrapper>
      <div className="page-header"><h1 className="page-title">Logistics Reports</h1></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
        <KpiCard index={0} icon="📦" label="Total Shipments" value={shipData?.total||0} color="pine"/>
        <KpiCard index={1} icon="✅" label="Delivered"       value={delivered}          color="forest"/>
        <KpiCard index={2} icon="🚚" label="In Transit"      value={inTransit}          color="copper"/>
        <KpiCard index={3} icon="💰" label="Shipping Cost"   value={Math.round(totalCost/1000)} prefix="$" suffix="K" color="sage"/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div className="card">
          <h3 className="section-title">Fleet Status</h3>
          {[['Available',vehData?.data?.filter(v=>v.status==='available').length||0,'#7FC4BF'],['In Use',vehData?.data?.filter(v=>v.status==='in_use').length||0,'#7AAE8E'],['Maintenance',vehData?.data?.filter(v=>v.status==='maintenance').length||0,'#C68642']].map(([l,v,c])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(44,95,93,0.06)', border:'1px solid rgba(94,139,126,0.12)', borderRadius:10, marginBottom:8 }}>
              <span style={{ fontSize:13, color:'rgba(212,207,196,0.6)' }}>{l}</span><span style={{ fontSize:24, fontWeight:700, fontFamily:'monospace', color:c }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 className="section-title">Recent Shipments</h3>
          {shipData?.data?.slice(0,5).map(s=>(
            <div key={s._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(94,139,126,0.08)' }}>
              <div><p style={{ fontFamily:'monospace', fontSize:12, color:'#7AAE8E' }}>{s.trackingNumber}</p><p style={{ fontSize:11, color:'rgba(212,207,196,0.35)' }}>{s.carrier}</p></div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}><StatusBadge status={s.status}/><span style={{ fontSize:12, color:'rgba(212,207,196,0.4)' }}>${s.cost||0}</span></div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
export default LogDashboard;
