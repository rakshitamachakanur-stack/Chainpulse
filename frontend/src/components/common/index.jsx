import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, size='md' }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  const sizes = { sm:'420px', md:'560px', lg:'720px', xl:'900px' };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}
          style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(6,12,10,0.78)', backdropFilter:'blur(6px)' }} onClick={onClose} />
          <motion.div initial={{ opacity:0, y:20, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:10, scale:0.97 }} transition={{ duration:0.2, ease:[0.16,1,0.3,1] }}
            style={{ position:'relative', width:'100%', maxWidth:sizes[size], background:'rgba(14,22,18,0.97)', border:'1px solid rgba(94,139,126,0.22)', borderRadius:20, boxShadow:'0 32px 80px rgba(0,0,0,0.6)', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid rgba(94,139,126,0.1)', flexShrink:0 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#F8F4EC', letterSpacing:'-0.01em' }}>{title}</h2>
              <button onClick={onClose} style={{ width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'rgba(94,139,126,0.1)', border:'none', cursor:'pointer', color:'rgba(212,207,196,0.6)', fontSize:18, lineHeight:1 }}>×</button>
            </div>
            <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ size='md', color='#C68642' }) {
  const s = { sm:16, md:24, lg:36 }[size];
  return (
    <div style={{ width:s, height:s, border:`2px solid rgba(212,207,196,0.12)`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_,i) => i+1)
    .filter(n => n===1 || n===pages || Math.abs(n-page)<=1);
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20 }}>
      <button disabled={page===1} onClick={()=>onPage(page-1)}
        style={{ padding:'6px 14px', borderRadius:9, border:'1px solid rgba(94,139,126,0.18)', background:'rgba(44,95,93,0.08)', color:'rgba(212,207,196,0.5)', fontSize:12, cursor:'pointer', opacity:page===1?0.4:1, fontFamily:'inherit' }}>
        ‹ Prev
      </button>
      {nums.map((n,i) => (
        <span key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
          {i>0 && nums[i-1]!==n-1 && <span style={{ color:'rgba(212,207,196,0.25)', fontSize:12 }}>…</span>}
          <button onClick={()=>onPage(n)}
            style={{ width:32, height:32, borderRadius:9, border:'none', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
              background: n===page ? '#C68642' : 'rgba(44,95,93,0.1)',
              color: n===page ? '#1A0F05' : 'rgba(212,207,196,0.5)' }}>
            {n}
          </button>
        </span>
      ))}
      <button disabled={page===pages} onClick={()=>onPage(page+1)}
        style={{ padding:'6px 14px', borderRadius:9, border:'1px solid rgba(94,139,126,0.18)', background:'rgba(44,95,93,0.08)', color:'rgba(212,207,196,0.5)', fontSize:12, cursor:'pointer', opacity:page===pages?0.4:1, fontFamily:'inherit' }}>
        Next ›
      </button>
    </div>
  );
}

// ── Status Badges ──────────────────────────────────────────────────────────────
const BADGE_STYLE = {
  // Order / Req statuses
  draft:            { bg:'rgba(46,50,57,0.5)',   color:'rgba(212,207,196,0.4)', border:'rgba(46,50,57,0.8)' },
  pending:          { bg:'rgba(198,134,66,0.12)', color:'#C68642',              border:'rgba(198,134,66,0.28)' },
  approved:         { bg:'rgba(44,95,93,0.15)',   color:'#7FC4BF',              border:'rgba(44,95,93,0.3)' },
  rejected:         { bg:'rgba(184,92,56,0.15)',  color:'#E08060',              border:'rgba(184,92,56,0.3)' },
  converted:        { bg:'rgba(94,139,126,0.15)', color:'#5E8B7E',              border:'rgba(94,139,126,0.3)' },
  processing:       { bg:'rgba(94,139,126,0.15)', color:'#5E8B7E',              border:'rgba(94,139,126,0.3)' },
  shipped:          { bg:'rgba(122,174,142,0.15)',color:'#7AAE8E',              border:'rgba(122,174,142,0.3)' },
  delivered:        { bg:'rgba(44,95,93,0.2)',    color:'#7FC4BF',              border:'rgba(44,95,93,0.35)' },
  cancelled:        { bg:'rgba(184,92,56,0.12)',  color:'#E08060',              border:'rgba(184,92,56,0.25)' },
  returned:         { bg:'rgba(184,92,56,0.12)',  color:'#E08060',              border:'rgba(184,92,56,0.25)' },
  // Inventory
  in_stock:         { bg:'rgba(44,95,93,0.18)',   color:'#7AAE8E',              border:'rgba(44,95,93,0.32)' },
  low_stock:        { bg:'rgba(198,134,66,0.15)', color:'#C68642',              border:'rgba(198,134,66,0.3)' },
  out_of_stock:     { bg:'rgba(184,92,56,0.15)',  color:'#E08060',              border:'rgba(184,92,56,0.3)' },
  overstock:        { bg:'rgba(94,139,126,0.15)', color:'#5E8B7E',              border:'rgba(94,139,126,0.3)' },
  // Shipment
  preparing:        { bg:'rgba(46,50,57,0.5)',    color:'rgba(212,207,196,0.5)', border:'rgba(46,50,57,0.8)' },
  picked_up:        { bg:'rgba(94,139,126,0.15)', color:'#5E8B7E',              border:'rgba(94,139,126,0.3)' },
  in_transit:       { bg:'rgba(94,139,126,0.18)', color:'#5E8B7E',              border:'rgba(94,139,126,0.35)' },
  out_for_delivery: { bg:'rgba(122,174,142,0.15)',color:'#7AAE8E',              border:'rgba(122,174,142,0.3)' },
  failed:           { bg:'rgba(184,92,56,0.15)',  color:'#E08060',              border:'rgba(184,92,56,0.3)' },
  // Vehicle
  available:        { bg:'rgba(44,95,93,0.18)',   color:'#7AAE8E',              border:'rgba(44,95,93,0.32)' },
  in_use:           { bg:'rgba(94,139,126,0.15)', color:'#5E8B7E',              border:'rgba(94,139,126,0.3)' },
  maintenance:      { bg:'rgba(198,134,66,0.15)', color:'#C68642',              border:'rgba(198,134,66,0.3)' },
  retired:          { bg:'rgba(184,92,56,0.12)',  color:'#E08060',              border:'rgba(184,92,56,0.25)' },
  // Supplier
  active:           { bg:'rgba(44,95,93,0.18)',   color:'#7AAE8E',              border:'rgba(44,95,93,0.3)' },
  inactive:         { bg:'rgba(46,50,57,0.5)',    color:'rgba(212,207,196,0.4)', border:'rgba(46,50,57,0.8)' },
  blacklisted:      { bg:'rgba(184,92,56,0.15)',  color:'#E08060',              border:'rgba(184,92,56,0.3)' },
  // Delivery
  scheduled:        { bg:'rgba(94,139,126,0.12)', color:'#5E8B7E',              border:'rgba(94,139,126,0.25)' },
  dispatched:       { bg:'rgba(122,174,142,0.15)',color:'#7AAE8E',              border:'rgba(122,174,142,0.3)' },
  // GRN
  verified:         { bg:'rgba(44,95,93,0.18)',   color:'#7FC4BF',              border:'rgba(44,95,93,0.32)' },
  // Priority
  low:              { bg:'rgba(46,50,57,0.4)',    color:'rgba(212,207,196,0.4)', border:'rgba(46,50,57,0.7)' },
  medium:           { bg:'rgba(94,139,126,0.15)', color:'#5E8B7E',              border:'rgba(94,139,126,0.3)' },
  high:             { bg:'rgba(198,134,66,0.15)', color:'#C68642',              border:'rgba(198,134,66,0.3)' },
  critical:         { bg:'rgba(184,92,56,0.18)',  color:'#E08060',              border:'rgba(184,92,56,0.35)' },
  // Payment
  paid:             { bg:'rgba(44,95,93,0.18)',   color:'#7AAE8E',              border:'rgba(44,95,93,0.3)' },
  partial:          { bg:'rgba(198,134,66,0.15)', color:'#C68642',              border:'rgba(198,134,66,0.3)' },
  overdue:          { bg:'rgba(184,92,56,0.15)',  color:'#E08060',              border:'rgba(184,92,56,0.3)' },
};

export function StatusBadge({ status }) {
  const s = BADGE_STYLE[status] || { bg:'rgba(46,50,57,0.4)', color:'rgba(212,207,196,0.4)', border:'rgba(46,50,57,0.7)' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500, letterSpacing:'0.03em', background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:'capitalize', whiteSpace:'nowrap' }}>
      {status?.replace(/_/g,' ')}
    </span>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger=false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p style={{ color:'rgba(212,207,196,0.6)', fontSize:13, marginBottom:20 }}>{message}</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn btn-danger' : 'btn btn-primary'}>Confirm</button>
      </div>
    </Modal>
  );
}
