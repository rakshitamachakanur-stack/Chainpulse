import { useState, useEffect } from 'react';
export default function TypingTerminal({ text='Monitoring supply chain operations', speed=45, delay=600, color='rgba(94,139,126,0.8)' }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false); let i=0;
    const start = setTimeout(() => {
      const t = setInterval(() => { i++; setDisplayed(text.slice(0,i)); if(i>=text.length){clearInterval(t);setDone(true);} }, speed);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(start);
  }, [text, speed, delay]);
  useEffect(() => {
    if(done) return;
    const t = setInterval(() => setShowCursor(p=>!p), 530);
    return () => clearInterval(t);
  }, [done]);
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, letterSpacing:'0.02em', color, display:'inline' }}>
      {displayed}
      <span style={{ display:'inline-block', width:2, height:'1em', marginLeft:2, borderRadius:1, verticalAlign:'text-bottom', background: done ? '#C68642' : color, opacity: done ? 1 : showCursor ? 1 : 0, transition:'opacity 0.1s' }} />
    </span>
  );
}
export function CyclingTerminal({ messages=[], pause=2200 }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if(messages.length<=1) return;
    const full = messages[index].length * 45 + 600 + pause;
    const t = setTimeout(() => setIndex(i=>(i+1)%messages.length), full);
    return () => clearTimeout(t);
  }, [index, messages, pause]);
  return <TypingTerminal key={index} text={messages[index]} />;
}
