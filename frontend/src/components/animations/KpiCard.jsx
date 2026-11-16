import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { DeltaBadge } from './DeltaBadge';

const colorMap = {
  forest: { bg:'rgba(44,95,93,0.18)',   border:'rgba(44,95,93,0.32)',    text:'#7FC4BF', glow:'rgba(44,95,93,0.12)' },
  copper: { bg:'rgba(198,134,66,0.15)', border:'rgba(198,134,66,0.3)',   text:'#C68642', glow:'rgba(198,134,66,0.1)' },
  pine:   { bg:'rgba(94,139,126,0.15)', border:'rgba(94,139,126,0.28)',  text:'#5E8B7E', glow:'rgba(94,139,126,0.1)' },
  brick:  { bg:'rgba(184,92,56,0.15)',  border:'rgba(184,92,56,0.28)',   text:'#E08060', glow:'rgba(184,92,56,0.1)' },
  sage:   { bg:'rgba(122,174,142,0.15)',border:'rgba(122,174,142,0.28)', text:'#7AAE8E', glow:'rgba(122,174,142,0.1)' },
};

const variants = {
  hidden: { opacity:0, y:20 },
  show: i => ({ opacity:1, y:0, transition:{ duration:0.32, delay: i*0.06, ease:[0.16,1,0.3,1] } }),
};

export function KpiCardSkeleton({ index=0 }) {
  return (
    <motion.div variants={variants} custom={index} initial="hidden" animate="show"
      style={{ background:'rgba(20,30,27,0.85)', border:'1px solid rgba(94,139,126,0.18)', borderRadius:14, padding:'20px 22px 24px', overflow:'hidden' }}>
      <div className="skeleton" style={{ width:36, height:36, borderRadius:9, marginBottom:14 }} />
      <div className="skeleton skeleton-title" style={{ width:'55%' }} />
      <div className="skeleton skeleton-text"  style={{ width:'80%' }} />
      <div className="skeleton skeleton-text"  style={{ width:'40%', marginTop:8 }} />
    </motion.div>
  );
}

// ✅ FIX: Accept both `label` and `title` so all dashboard pages work correctly
export default function KpiCard({ title, label, value, prefix='', suffix='', delta, deltaUp=true, icon, color='forest', loading=false, index=0 }) {
  if (loading) return <KpiCardSkeleton index={index} />;
  const c = colorMap[color] || colorMap.forest;
  const displayLabel = label || title || '';   // prefer label (used by dashboards), fall back to title
  return (
    <motion.div variants={variants} custom={index} initial="hidden" animate="show"
      whileHover={{ y:-3, boxShadow:`0 12px 36px rgba(0,0,0,0.3), 0 0 0 1px ${c.border}`, transition:{duration:0.2} }}
      style={{ position:'relative', background:'rgba(20,30,27,0.85)', border:`1px solid ${c.border}`, borderRadius:14, padding:'20px 22px 24px', overflow:'hidden', boxShadow:`0 0 20px ${c.glow}` }}>
      {/* Icon */}
      <div style={{ width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, background:c.bg, color:c.text, fontSize:18 }}>{icon}</div>
      {/* Value */}
      <div style={{ marginBottom:4 }}>
        <span style={{ fontSize:32, fontWeight:700, color:'#F8F4EC', letterSpacing:'-0.03em', fontFamily:"'JetBrains Mono',monospace" }}>
          {prefix}
          <CountUp start={0} end={typeof value === 'number' ? value : 0} duration={1.8} separator="," decimals={suffix==='%'?1:0} useEasing={true} />
          {suffix}
        </span>
      </div>
      {/* Label / Title */}
      <p style={{ fontSize:13, color:'rgba(212,207,196,0.5)', fontFamily:'sans-serif', fontWeight:400 }}>{displayLabel}</p>
      {/* Delta */}
      {delta && <div style={{ marginTop:8 }}><DeltaBadge value={delta} up={deltaUp} /></div>}
      {/* Bottom accent */}
      <motion.div style={{ position:'absolute', bottom:0, left:0, height:2, width:'100%', background:c.text, transformOrigin:'left', borderRadius:'0 0 14px 14px', opacity:0.5 }}
        initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ duration:0.6, delay:index*0.06+0.3, ease:[0.16,1,0.3,1] }} />
    </motion.div>
  );
}
