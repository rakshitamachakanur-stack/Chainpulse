import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, requisitionAPI, orderAPI, supplierAPI, inventoryAPI, shipmentAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import { Modal, StatusBadge, Pagination, Spinner } from '../../components/common/index.jsx';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import KpiCard, { KpiCardSkeleton } from '../../components/animations/KpiCard';
import PageWrapper from '../../components/animations/PageWrapper';
import { DeltaBadge } from '../../components/animations/DeltaBadge';
import { motion } from 'framer-motion';
import { generatePurchaseOrderPDF } from '../../utils/pdfGenerator';
import SupplierScorecardsPanel from '../../components/common/SupplierScorecardsPanel';
import DemandForecastingPanel from '../../components/common/DemandForecastingPanel';
import LiveShipmentMap from '../../components/common/LiveShipmentMap';
import ShipmentQRModal from '../../components/common/ShipmentQRModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PALETTE = ['#2C5F5D','#C68642','#7AAE8E','#B85C38','#5E8B7E','#D4944E'];
const TT = { contentStyle:{ background:'rgba(14,22,18,0.95)', border:'1px solid rgba(94,139,126,0.2)', borderRadius:10, color:'#F8F4EC', fontSize:12 } };
const pct = (a,b) => b===0 ? null : Math.abs(((a-b)/b)*100).toFixed(1);

// ── Manager Dashboard ─────────────────────────────────────────────────────────
export function MgrDashboard() {
  const { data, isLoading } = useQuery({ queryKey:['analytics-dashboard'], queryFn:()=>analyticsAPI.dashboard().then(r=>r.data.data), refetchInterval:15000 });
  const kpis = data?.kpis || {};
  const revTrend = (data?.revenueTrend||[]).map(r=>({ name: r._id?.m ? MONTHS[r._id.m-1] : '?', revenue:r.revenue||0, orders:r.orders||0 }));
  const orderPie = (data?.orderStatus||[]).map((s,i)=>({ name:s._id?.replace(/_/g,' '), value:s.count, fill:PALETTE[i%PALETTE.length] }));
  const topSuppliers = (data?.topSuppliers||[]).map(s=>({ name:s.s?.name?.split(' ')[0]||'?', value:s.value||0 }));

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <div className="section-accent"><h1 className="page-title">Manager Dashboard</h1></div>
          <p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>{format(new Date(),'EEEE, MMM d yyyy')}</p>
        </div>
        <Link to="/approvals" style={{ position:'relative', textDecoration:'none' }} className="btn btn-manager">
          ✅ Approvals
          {kpis.pendingApprovals>0&&<span className="badge-bounce" style={{ position:'absolute', top:-6, right:-6, width:18, height:18, background:'#B85C38', color:'#F8F4EC', fontSize:10, fontWeight:700, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>{kpis.pendingApprovals}</span>}
        </Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        {isLoading ? [0,1,2,3].map(i=><KpiCardSkeleton key={i} index={i}/>) : <>
          <KpiCard index={0} icon="📋" label="Orders (Month)"    value={kpis.totalOrders||0}       color="copper" />
          <KpiCard index={1} icon="💰" label="Revenue (Month)"   value={Math.round((kpis.revenue||0)/1000)} prefix="$" suffix="K" color="forest"
            delta={pct(kpis.revenue,kpis.lastRevenue)} deltaUp={(kpis.revenue||0)>=(kpis.lastRevenue||0)} />
          <KpiCard index={2} icon="⏳" label="Pending Approvals" value={kpis.pendingApprovals||0}  color="brick"  delta={kpis.pendingApprovals>0?'Needs review':null} deltaUp={false} />
          <KpiCard index={3} icon="⚠️" label="Low Stock Items"   value={kpis.lowStockCount||0}     color="pine"   />
        </>}
      </div>

      <div className="copper-divider" />

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
        <motion.div className="card chart-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <h3 className="section-title">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,139,126,0.1)" />
              <XAxis dataKey="name" stroke="rgba(212,207,196,0.3)" tick={{ fontSize:11, fill:'rgba(212,207,196,0.4)' }} />
              <YAxis yAxisId="left" stroke="rgba(198,134,66,0.4)" tick={{ fontSize:11, fill:'rgba(198,134,66,0.5)' }} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(94,139,126,0.4)" tick={{ fontSize:11, fill:'rgba(94,139,126,0.5)' }} />
              <Tooltip {...TT} formatter={(v,n)=>n==='Revenue'?[`$${v.toLocaleString()}`,'Revenue']:[v,'Orders']} />
              <Legend formatter={v=><span style={{ color:'rgba(212,207,196,0.5)', fontSize:11 }}>{v}</span>} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#C68642" strokeWidth={2.5} dot={false} name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#5E8B7E" strokeWidth={2} dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div className="card chart-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
          <h3 className="section-title">Order Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={orderPie} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                {orderPie.map((e,i)=><Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip {...TT} />
              <Legend iconSize={8} formatter={v=><span style={{ color:'rgba(212,207,196,0.45)', fontSize:10 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div className="card chart-container" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
        <h3 className="section-title">Top Suppliers by Order Value</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={topSuppliers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,139,126,0.1)" />
            <XAxis type="number" stroke="rgba(212,207,196,0.2)" tick={{ fontSize:11, fill:'rgba(212,207,196,0.35)' }} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
            <YAxis dataKey="name" type="category" stroke="rgba(212,207,196,0.2)" tick={{ fontSize:11, fill:'rgba(212,207,196,0.5)' }} width={80} />
            <Tooltip {...TT} formatter={v=>[`$${v.toLocaleString()}`,'Value']} />
            <Bar dataKey="value" fill="#C68642" radius={[0,6,6,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </PageWrapper>
  );
}

// ── Approvals ─────────────────────────────────────────────────────────────────
export function ApprovalsPage() {
  const qc = useQueryClient();
  const [approveModal, setApproveModal] = useState(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({ queryKey:['pending-reqs'], queryFn:()=>requisitionAPI.getAll({status:'pending',limit:50}).then(r=>r.data), refetchInterval:10000 });

  const approveMut = useMutation({
    mutationFn: ({ id, action, note }) => requisitionAPI.approve(id, { action, note }),
    onSuccess: (_, v) => {
      qc.invalidateQueries(['pending-reqs']); qc.invalidateQueries(['requisitions']);
      qc.invalidateQueries(['analytics-dashboard']); qc.invalidateQueries(['mgr-orders']);
      qc.invalidateQueries(['orders']); qc.invalidateQueries(['admin-stats']); qc.invalidateQueries(['admin-activity']);
      toast.success(`Requisition ${v.action}d`); setApproveModal(null); setNote('');
    }
  });

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <div className="section-accent"><h1 className="page-title">Approvals</h1></div>
          <p style={{ color:'rgba(212,207,196,0.35)', fontSize:13, marginTop:4 }}>{data?.total||0} pending</p>
        </div>
      </div>

      {isLoading ? <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><Spinner size="lg" className="text-amber-500" /></div> : (
        data?.data?.length===0 ? (
          <div className="card empty-state">
            <span style={{ fontSize:48 }}>✅</span>
            <p style={{ fontSize:16, fontWeight:600, color:'rgba(212,207,196,0.6)' }}>All caught up!</p>
            <p>No pending approvals</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {data?.data?.map((r,i)=>(
              <motion.div key={r._id} className="card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontFamily:'monospace', color:'#C68642', fontWeight:700, fontSize:13 }}>{r.reqNumber}</span>
                      <StatusBadge status={r.priority}/>
                    </div>
                    <p style={{ fontWeight:700, color:'#F8F4EC', fontSize:15, marginBottom:6 }}>{r.title}</p>
                    <p style={{ fontSize:13, color:'rgba(212,207,196,0.45)', marginBottom:10 }}>{r.justification||'No justification provided'}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:12, color:'rgba(212,207,196,0.4)', flexWrap:'wrap' }}>
                      <span>By: <span style={{ color:'rgba(212,207,196,0.7)' }}>{r.createdBy?.name}</span></span>
                      <span>Items: <span style={{ color:'rgba(212,207,196,0.7)' }}>{r.items?.length}</span></span>
                      <span>Total: <span style={{ fontWeight:700, color:'#F8F4EC', fontSize:15 }}>${r.totalAmount?.toLocaleString()}</span></span>
                      {r.neededBy&&!isNaN(new Date(r.neededBy))&&<span>Needed: <span style={{ color:'rgba(212,207,196,0.7)' }}>{format(new Date(r.neededBy),'MMM d, yyyy')}</span></span>}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                      {r.items?.slice(0,3).map((it,i)=>(
                        <span key={i} style={{ padding:'3px 10px', background:'rgba(44,95,93,0.1)', border:'1px solid rgba(94,139,126,0.15)', borderRadius:999, fontSize:11, color:'rgba(212,207,196,0.55)' }}>
                          {it.product?.name} × {it.quantity}
                        </span>
                      ))}
                      {r.items?.length>3&&<span style={{ padding:'3px 10px', background:'rgba(44,95,93,0.08)', borderRadius:999, fontSize:11, color:'rgba(212,207,196,0.35)' }}>+{r.items.length-3} more</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                    <button onClick={()=>{ setApproveModal({id:r._id,action:'approve',reqNum:r.reqNumber}); setNote(''); }} className="btn btn-success" style={{ whiteSpace:'nowrap' }}>✓ Approve</button>
                    <button onClick={()=>{ setApproveModal({id:r._id,action:'reject',reqNum:r.reqNumber}); setNote(''); }} className="btn btn-danger" style={{ whiteSpace:'nowrap' }}>✗ Reject</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      <Modal isOpen={!!approveModal} onClose={()=>setApproveModal(null)} title={approveModal?.action==='approve'?'Approve Requisition':'Reject Requisition'} size="sm">
        <p style={{ color:'rgba(212,207,196,0.6)', fontSize:13, marginBottom:16 }}>
          {approveModal?.reqNum} — {approveModal?.action==='approve'?'This allows procurement to create a Purchase Order.':'Please provide a reason for rejection.'}
        </p>
        <div style={{ marginBottom:16 }}>
          <label className="label">Note {approveModal?.action==='reject'?'*':'(optional)'}</label>
          <textarea className="textarea" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add comment…" />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={()=>setApproveModal(null)} className="btn btn-secondary">Cancel</button>
          <button onClick={()=>approveMut.mutate({id:approveModal.id,action:approveModal.action,note})}
            disabled={approveMut.isPending||(approveModal?.action==='reject'&&!note)}
            className={approveModal?.action==='approve'?'btn btn-success':'btn btn-danger'}>
            {approveMut.isPending?<Spinner size="sm"/>:(approveModal?.action==='approve'?'✓ Approve':'✗ Reject')}
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}

// ── Orders read-only ──────────────────────────────────────────────────────────
export function MgrOrdersPage() {
  const [page,setPage]=useState(1);
  const [status,setStatus]=useState('');
  const { data,isLoading } = useQuery({ queryKey:['mgr-orders',page,status], queryFn:()=>orderAPI.getAll({page,limit:15,status}).then(r=>r.data), refetchInterval:20000 });
  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">All Orders</h1></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
        <div className="card"><p style={{ color:'rgba(212,207,196,0.4)', fontSize:12 }}>Total Orders</p><p style={{ fontSize:28, fontWeight:700, color:'#F8F4EC', fontFamily:'monospace' }}>{data?.total||0}</p></div>
        <div className="card"><p style={{ color:'rgba(212,207,196,0.4)', fontSize:12 }}>Page Value</p><p style={{ fontSize:28, fontWeight:700, color:'#C68642', fontFamily:'monospace' }}>${Math.round((data?.data?.reduce((s,o)=>s+o.totalAmount,0)||0)/1000)}K</p></div>
        <div className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <select className="select" value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {['draft','pending','approved','processing','shipped','delivered','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><Spinner size="lg"/></div>:(
        <><div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>PO #</th><th>Supplier</th><th>Created By</th><th>Total</th><th>Priority</th><th>Status</th><th>Payment</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {data?.data?.map(o=>(
              <tr key={o._id}>
                <td><span style={{ fontFamily:'monospace', color:'#C68642', fontSize:12, fontWeight:600 }}>{o.orderNumber}</span></td>
                <td style={{ color:'rgba(212,207,196,0.7)' }}>{o.supplier?.name}</td>
                <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{o.createdBy?.name}</td>
                <td style={{ fontWeight:700, color:'#F8F4EC' }}>${o.totalAmount?.toLocaleString()}</td>
                <td><StatusBadge status={o.priority}/></td>
                <td><StatusBadge status={o.status}/></td>
                <td><StatusBadge status={o.paymentStatus}/></td>
                <td style={{ fontSize:12, color:'rgba(212,207,196,0.35)' }}>{o.createdAt&&!isNaN(new Date(o.createdAt))?format(new Date(o.createdAt),'MMM d, yyyy'):'—'}</td>
                <td>
                  <button onClick={()=>generatePurchaseOrderPDF(o)} className="btn btn-secondary btn-sm" title="Download Official PO PDF">
                    📄 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination page={page} pages={data?.pages||1} onPage={setPage}/></>
      )}
    </PageWrapper>
  );
}

export function MgrSuppliersPage() {
  const [tab, setTab] = useState('scorecards');
  const { data,isLoading } = useQuery({ queryKey:['mgr-suppliers'], queryFn:()=>supplierAPI.getAll({limit:50}).then(r=>r.data), refetchInterval:30000 });
  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Suppliers</h1></div></div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>setTab('scorecards')} className={`btn ${tab==='scorecards'?'btn-manager':'btn-secondary'} btn-sm`}>
            🏆 Performance Scorecards
          </button>
          <button onClick={()=>setTab('directory')} className={`btn ${tab==='directory'?'btn-manager':'btn-secondary'} btn-sm`}>
            🏭 Directory ({data?.data?.length || 0})
          </button>
        </div>
      </div>

      {tab === 'scorecards' ? (
        <SupplierScorecardsPanel />
      ) : (
        isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><Spinner size="lg"/></div>:(
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Supplier</th><th>Category</th><th>Lead Time</th><th>Rating</th><th>Payment Terms</th><th>Status</th></tr></thead>
            <tbody>
              {data?.data?.map(s=>(
                <tr key={s._id}>
                  <td><div style={{ fontWeight:600, color:'rgba(212,207,196,0.85)' }}>{s.name}</div><div style={{ fontSize:10, fontFamily:'monospace', color:'rgba(212,207,196,0.35)', marginTop:2 }}>{s.code}</div></td>
                  <td><span style={{padding:'2px 8px',borderRadius:999,fontSize:11,background:'rgba(44,95,93,0.12)',color:'#5E8B7E',border:'1px solid rgba(44,95,93,0.2)',textTransform:'capitalize'}}>{s.category?.replace(/_/g,' ')}</span></td>
                  <td style={{ color:'rgba(212,207,196,0.5)' }}>{s.leadTime} days</td>
                  <td><span style={{ color:'#C68642' }}>★</span><span style={{ color:'rgba(212,207,196,0.7)' }}>{s.rating?.toFixed(1)}</span></td>
                  <td style={{ color:'rgba(212,207,196,0.5)' }}>{s.paymentTerms}</td>
                  <td><StatusBadge status={s.status}/></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )
      )}
    </PageWrapper>
  );
}

export function MgrInventoryPage() {
  const [tab, setTab] = useState('forecast');
  const [page,setPage]=useState(1);
  const { data,isLoading } = useQuery({ queryKey:['mgr-inventory',page], queryFn:()=>inventoryAPI.getAll({page,limit:15}).then(r=>r.data), refetchInterval:20000 });
  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Inventory Management</h1></div></div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>setTab('forecast')} className={`btn ${tab==='forecast'?'btn-manager':'btn-secondary'} btn-sm`}>
            📈 Demand Forecasting & Reorders
          </button>
          <button onClick={()=>setTab('overview')} className={`btn ${tab==='overview'?'btn-manager':'btn-secondary'} btn-sm`}>
            📦 Stock Overview
          </button>
        </div>
      </div>

      {tab === 'forecast' ? (
        <DemandForecastingPanel />
      ) : (
        isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><Spinner size="lg"/></div>:(
          <><div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Product</th><th>Location</th><th>Qty</th><th>Available</th><th>Reorder@</th><th>Status</th></tr></thead>
            <tbody>
              {data?.data?.map(item=>(
                <tr key={item._id}>
                  <td><div style={{ fontWeight:600, color:'rgba(212,207,196,0.85)' }}>{item.product?.name}</div><div style={{ fontSize:10, fontFamily:'monospace', color:'rgba(212,207,196,0.35)', marginTop:2 }}>{item.product?.sku}</div></td>
                  <td style={{ fontSize:11, fontFamily:'monospace', color:'rgba(212,207,196,0.4)' }}>{item.location?.aisle}-{item.location?.shelf}</td>
                  <td style={{ fontWeight:700, color:'#F8F4EC', fontFamily:'monospace' }}>{item.quantity}</td>
                  <td style={{ color:item.available<=0?'#E08060':'#7AAE8E', fontWeight:600 }}>{item.available}</td>
                  <td style={{ color:'rgba(212,207,196,0.4)' }}>{item.reorderPoint}</td>
                  <td><StatusBadge status={item.status}/></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/></>
        )
      )}
    </PageWrapper>
  );
}

export function MgrShipmentsPage() {
  const [tab, setTab] = useState('map');
  const [page,setPage]=useState(1);
  const [qrModal, setQrModal]=useState(null);
  const { data,isLoading } = useQuery({ queryKey:['mgr-shipments',page], queryFn:()=>shipmentAPI.getAll({page,limit:15}).then(r=>r.data), refetchInterval:20000 });
  return (
    <PageWrapper>
      <div className="page-header">
        <div><div className="section-accent"><h1 className="page-title">Shipment Monitoring</h1></div></div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>setTab('map')} className={`btn ${tab==='map'?'btn-manager':'btn-secondary'} btn-sm`}>
            🗺️ Live Fleet Radar
          </button>
          <button onClick={()=>setTab('table')} className={`btn ${tab==='table'?'btn-manager':'btn-secondary'} btn-sm`}>
            📋 All Shipments ({data?.total || 0})
          </button>
        </div>
      </div>

      {tab === 'map' ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <LiveShipmentMap onOpenQR={s=>setQrModal(s)} />
        </div>
      ) : (
        isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><Spinner size="lg"/></div>:(
          <><div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Tracking #</th><th>Carrier</th><th>Route</th><th>ETA</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data?.data?.map(s=>(
                <tr key={s._id}>
                  <td><span style={{ fontFamily:'monospace', color:'#C68642', fontSize:12 }}>{s.trackingNumber}</span></td>
                  <td style={{ color:'rgba(212,207,196,0.7)' }}>{s.carrier}</td>
                  <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{s.origin?.city}→{s.destination?.city}</td>
                  <td style={{ fontSize:12, color:'rgba(212,207,196,0.45)' }}>{s.estimatedDelivery&&!isNaN(new Date(s.estimatedDelivery))?format(new Date(s.estimatedDelivery),'MMM d, yyyy'):'—'}</td>
                  <td><StatusBadge status={s.status}/></td>
                  <td>
                    <button onClick={()=>setQrModal(s)} className="btn btn-secondary btn-sm" title="View QR Tracking Code">
                      📱 QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <Pagination page={page} pages={data?.pages||1} onPage={setPage}/></>
        )
      )}

      {/* QR Modal */}
      <ShipmentQRModal isOpen={!!qrModal} onClose={()=>setQrModal(null)} shipment={qrModal} />
    </PageWrapper>
  );
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey:['analytics-dashboard'], queryFn:()=>analyticsAPI.dashboard().then(r=>r.data.data), refetchInterval:15000 });
  const revTrend = (data?.revenueTrend||[]).map(r=>({ name: r._id?.m ? `${MONTHS[r._id.m-1]} ${r._id.y}` : '?', revenue:r.revenue||0, orders:r.orders||0 }));
  const orderPie = (data?.orderStatus||[]).map((s,i)=>({ name:s._id?.replace(/_/g,' '), value:s.count, fill:PALETTE[i%PALETTE.length] }));
  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">Analytics</h1></div></div>
      {isLoading?<div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}><Spinner size="lg"/></div>:(
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div className="card chart-container">
            <h3 className="section-title">Revenue (6 Months)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,139,126,0.1)" />
                <XAxis dataKey="name" stroke="rgba(212,207,196,0.2)" tick={{ fontSize:10, fill:'rgba(212,207,196,0.35)' }} />
                <YAxis yAxisId="left" stroke="rgba(198,134,66,0.3)" tick={{ fontSize:11, fill:'rgba(198,134,66,0.45)' }} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(94,139,126,0.3)" tick={{ fontSize:11, fill:'rgba(94,139,126,0.45)' }} />
                <Tooltip {...TT} formatter={(v,n)=>n==='Revenue'?[`$${v.toLocaleString()}`,'Revenue']:[v,'Orders']} />
                <Legend formatter={v=><span style={{ color:'rgba(212,207,196,0.4)', fontSize:11 }}>{v}</span>} />
                <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#C68642" strokeWidth={2.5} dot={false} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders"  stroke="#5E8B7E" strokeWidth={2}   dot={false} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card chart-container">
            <h3 className="section-title">Order Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderPie} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                  {orderPie.map((e,i)=><Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip {...TT} />
                <Legend iconSize={8} formatter={v=><span style={{ color:'rgba(212,207,196,0.45)', fontSize:11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export function MgrReportsPage() {
  return (
    <PageWrapper>
      <div className="page-header"><div className="section-accent"><h1 className="page-title">Executive Reports</h1></div></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[['📊 Supply Chain Overview','Full pipeline: requisition → delivery','/analytics','#C68642'],
          ['📋 Order Reports','Purchase order history & spend','/orders','#2C5F5D'],
          ['🏭 Supplier Performance','Ratings, lead times & reliability','/suppliers','#7AAE8E'],
          ['📦 Inventory Health','Stock levels, reorders & valuations','/inventory','#B85C38'],
        ].map(([title,desc,to,col])=>(
          <Link key={to} to={to} style={{ textDecoration:'none' }}>
            <motion.div className="card" whileHover={{ y:-3, borderColor:`${col}44` }} style={{ cursor:'pointer' }}>
              <h3 style={{ fontWeight:700, color:'#F8F4EC', marginBottom:6, fontSize:15 }}>{title}</h3>
              <p style={{ fontSize:13, color:'rgba(212,207,196,0.4)', marginBottom:12 }}>{desc}</p>
              <p style={{ fontSize:12, color:col }}>View report →</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}

export default MgrDashboard;
