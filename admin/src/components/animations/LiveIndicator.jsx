import { useState, useEffect } from 'react';
export default function LiveIndicator() {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const t = setInterval(() => { setActive(false); setTimeout(() => setActive(true), 300); }, 8000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:999, background:'rgba(44,95,93,0.18)', border:'1px solid rgba(44,95,93,0.3)' }}>
      <span className="live-dot" style={{ opacity: active ? 1 : 0.2, transition:'opacity 0.3s ease' }} />
      <span style={{ fontSize:11, color:'#7AAE8E', letterSpacing:'0.08em', fontWeight:500, fontFamily:'sans-serif' }}>Live</span>
    </div>
  );
}
