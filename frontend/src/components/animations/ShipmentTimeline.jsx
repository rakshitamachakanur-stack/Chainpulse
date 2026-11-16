import { motion } from 'framer-motion';
const STAGES = [
  { key:'pending',          label:'Pending'      },
  { key:'picked_up',        label:'Picked Up'    },
  { key:'in_transit',       label:'In Transit'   },
  { key:'out_for_delivery', label:'Out Delivery'  },
  { key:'delivered',        label:'Delivered'    },
];
export default function ShipmentTimeline({ status='pending' }) {
  const currentIndex = STAGES.findIndex(s => s.key === status);
  const isFailed = status === 'failed' || status === 'returned';
  const fillPct = isFailed ? 0 : Math.max(0, currentIndex) / (STAGES.length - 1);
  return (
    <div style={{ padding:'10px 0 36px', userSelect:'none' }}>
      <div style={{ position:'relative', height:36, margin:'0 20px' }}>
        {/* Track bg */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, height:2, background:'rgba(94,139,126,0.12)', transform:'translateY(-50%)', borderRadius:2 }} />
        {/* Animated fill */}
        <motion.div
          style={{ position:'absolute', top:'50%', left:0, width:'100%', height:2, background:'linear-gradient(90deg,#2C5F5D,#C68642)', transformOrigin:'left center', transform:'translateY(-50%)', borderRadius:2 }}
          initial={{ scaleX:0 }} animate={{ scaleX: fillPct }} transition={{ duration:0.9, ease:[0.16,1,0.3,1], delay:0.2 }} />
        {/* Dots */}
        {STAGES.map((stage, i) => {
          const isDone   = !isFailed && i < currentIndex;
          const isActive = !isFailed && i === currentIndex;
          return (
            <div key={stage.key} style={{ position:'absolute', top:'50%', left:`${(i/(STAGES.length-1))*100}%`, transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <motion.div
                style={{ width:18, height:18, borderRadius:'50%', border:'2px solid', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2,
                  background: isDone?'#2C5F5D' : isActive?'#C68642' : 'rgba(94,139,126,0.1)',
                  borderColor: isDone?'#2C5F5D' : isActive?'#C68642' : 'rgba(94,139,126,0.25)' }}
                initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:i*0.08+0.1, duration:0.3, ease:[0.34,1.56,0.64,1] }}>
                {isDone && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#F8F4EC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {isActive && <motion.div style={{ position:'absolute', inset:-2, borderRadius:'50%', border:'2px solid #C68642', pointerEvents:'none' }}
                  animate={{ scale:[1,2.2], opacity:[0.6,0] }} transition={{ duration:1.8, repeat:Infinity, ease:'easeOut' }} />}
              </motion.div>
              <motion.span style={{ position:'absolute', top:24, fontSize:9, fontFamily:'sans-serif', letterSpacing:'0.04em', whiteSpace:'nowrap',
                color: isDone?'#7FC4BF' : isActive?'#C68642' : 'rgba(212,207,196,0.3)', fontWeight: isActive?600:400 }}
                initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08+0.2 }}>
                {stage.label}
              </motion.span>
            </div>
          );
        })}
      </div>
      {isFailed && <motion.p style={{ marginTop:24, fontSize:12, color:'#E08060', fontFamily:'sans-serif', textAlign:'center' }}
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>✕ Shipment failed</motion.p>}
    </div>
  );
}
