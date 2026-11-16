import { motion } from 'framer-motion';
export function DeltaBadge({ value, up=true, suffix='' }) {
  return (
    <motion.span
      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:999, fontSize:11, fontWeight:500,
        background: up ? 'rgba(122,174,142,0.12)' : 'rgba(184,92,56,0.12)',
        border: `1px solid ${up ? 'rgba(122,174,142,0.25)' : 'rgba(184,92,56,0.25)'}`,
        color: up ? '#7AAE8E' : '#E08060',
      }}
      initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.4 }}>
      <motion.span style={{ display:'inline-block', fontWeight:700, lineHeight:1 }}
        initial={{ y: up?4:-4, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4, delay:0.5, ease:[0.34,1.56,0.64,1] }}>
        {up ? '↑' : '↓'}
      </motion.span>
      <span>{value}</span>
      {suffix && <span style={{ opacity:0.6, fontSize:10, marginLeft:2 }}>{suffix}</span>}
    </motion.span>
  );
}
export function InlineDelta({ value, up=true }) {
  return <span style={{ fontSize:12, fontWeight:600, color: up?'#7AAE8E':'#E08060', fontFamily:'sans-serif', letterSpacing:'0.02em' }}>{up?'↑':'↓'} {value}</span>;
}
export default DeltaBadge;
