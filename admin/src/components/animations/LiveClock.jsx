import { useState, useEffect } from 'react';
export default function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const p = n => String(n).padStart(2,'0');
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(212,207,196,0.5)', userSelect:'none' }}>
      <span>{DAYS[time.getDay()]} {p(time.getDate())} {MONTHS[time.getMonth()]} {time.getFullYear()}</span>
      <span style={{color:'rgba(94,139,126,0.4)'}}>·</span>
      <span style={{color:'rgba(212,207,196,0.65)', letterSpacing:'0.06em'}}>
        {p(time.getHours())}
        <span style={{opacity:0.4, margin:'0 1px'}}>:</span>
        {p(time.getMinutes())}
        <span style={{opacity:0.4, margin:'0 1px'}}>:</span>
        <span style={{color:'#C68642'}}>{p(time.getSeconds())}</span>
      </span>
    </div>
  );
}
