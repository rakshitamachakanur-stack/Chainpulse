import { useEffect, useRef } from 'react';
const FOREST='#2C5F5D', COPPER='#C68642', PINE='#5E8B7E', BRICK='#B85C38';
export default function NetworkBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let animId, frame=0, nodes=[], packets=[];
    function resize(){ canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; }
    function init(){
      const W=canvas.width, H=canvas.height; nodes=[]; packets=[];
      const hubs=[
        {x:W*.12,y:H*.18,type:'hub',label:'WH-01',color:FOREST},
        {x:W*.82,y:H*.22,type:'hub',label:'WH-02',color:FOREST},
        {x:W*.50,y:H*.10,type:'hub',label:'HUB',  color:PINE},
        {x:W*.20,y:H*.75,type:'hub',label:'WH-03',color:FOREST},
        {x:W*.78,y:H*.80,type:'hub',label:'WH-04',color:FOREST},
        {x:W*.50,y:H*.88,type:'hub',label:'DIST', color:COPPER},
      ];
      const minor=[]; const avoid={x:W/2,y:H/2,r:210}; let att=0;
      while(minor.length<18&&att<400){ att++;
        const x=30+Math.random()*(W-60), y=30+Math.random()*(H-60);
        const dx=x-avoid.x, dy=y-avoid.y;
        if(Math.sqrt(dx*dx+dy*dy)<avoid.r) continue;
        minor.push({x,y,type:'minor'});
      }
      nodes=[...hubs,...minor];
      nodes.forEach((n,i)=>{n.id=i;n.edges=[];});
      for(let i=0;i<hubs.length;i++) for(let j=i+1;j<hubs.length;j++){hubs[i].edges.push(j);hubs[j].edges.push(i);}
      minor.forEach((mn,mi)=>{
        const idx=hubs.length+mi;
        hubs.map((h,hi)=>({hi,dist:Math.hypot(mn.x-h.x,mn.y-h.y)})).sort((a,b)=>a.dist-b.dist).slice(0,2).forEach(({hi})=>{nodes[idx].edges.push(hi);nodes[hi].edges.push(idx);});
      });
      for(let i=0;i<18;i++) spawnPacket();
    }
    function spawnPacket(){
      const si=Math.floor(Math.random()*nodes.length), src=nodes[si];
      if(!src||src.edges.length===0) return;
      const di=src.edges[Math.floor(Math.random()*src.edges.length)], dst=nodes[di];
      packets.push({src:si,dst:di,x:src.x,y:src.y,tx:dst.x,ty:dst.y,progress:Math.random(),speed:0.003+Math.random()*0.004,color:[COPPER,COPPER,FOREST,PINE,BRICK][Math.floor(Math.random()*5)],size:2+Math.random()*2});
    }
    function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
    function hex2rgba(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}
    function draw(){
      const W=canvas.width, H=canvas.height;
      ctx.clearRect(0,0,W,H);
      const g=ctx.createRadialGradient(W*.4,H*.4,0,W*.5,H*.5,Math.max(W,H)*.85);
      g.addColorStop(0,'rgba(22,32,30,1)');g.addColorStop(0.5,'rgba(16,22,20,1)');g.addColorStop(1,'rgba(10,13,12,1)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      nodes.forEach((n,i)=>{n.edges.forEach(j=>{
        if(j<=i) return; const m=nodes[j], hub=n.type==='hub'&&m.type==='hub';
        ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(m.x,m.y);
        ctx.strokeStyle=hub?'rgba(198,134,66,0.13)':'rgba(94,139,126,0.07)';
        ctx.lineWidth=hub?1:0.5; ctx.setLineDash(hub?[6,10]:[3,10]); ctx.stroke(); ctx.setLineDash([]);
      });});
      packets.forEach(p=>{
        const t=ease(p.progress), x=p.x+(p.tx-p.x)*t, y=p.y+(p.ty-p.y)*t;
        const t0=Math.max(0,p.progress-0.08), te=ease(t0), tx0=p.x+(p.tx-p.x)*te, ty0=p.y+(p.ty-p.y)*te;
        const tg=ctx.createLinearGradient(tx0,ty0,x,y); tg.addColorStop(0,'transparent'); tg.addColorStop(1,p.color);
        ctx.beginPath(); ctx.moveTo(tx0,ty0); ctx.lineTo(x,y); ctx.strokeStyle=tg; ctx.lineWidth=1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(x,y,p.size+1.5,0,Math.PI*2); ctx.fillStyle=hex2rgba(p.color,0.18); ctx.fill();
        ctx.beginPath(); ctx.arc(x,y,p.size,0,Math.PI*2); ctx.fillStyle=p.color; ctx.fill();
      });
      nodes.forEach(n=>{
        if(n.type==='hub'){
          const pulse=0.5+0.5*Math.sin(frame*0.025+n.id*1.3);
          ctx.beginPath(); ctx.arc(n.x,n.y,16+pulse*5,0,Math.PI*2); ctx.strokeStyle=hex2rgba(n.color,0.06+pulse*0.07); ctx.lineWidth=1; ctx.stroke();
          ctx.beginPath(); ctx.arc(n.x,n.y,10,0,Math.PI*2); ctx.strokeStyle=hex2rgba(n.color,0.28); ctx.lineWidth=1; ctx.stroke();
          ctx.beginPath(); ctx.arc(n.x,n.y,5,0,Math.PI*2); ctx.fillStyle=n.color; ctx.shadowColor=n.color; ctx.shadowBlur=6; ctx.fill(); ctx.shadowBlur=0;
          ctx.font="9px 'JetBrains Mono',monospace"; ctx.fillStyle=hex2rgba(n.color,0.75); ctx.textAlign='center'; ctx.fillText(n.label,n.x,n.y-18);
        } else {
          ctx.beginPath(); ctx.arc(n.x,n.y,2,0,Math.PI*2); ctx.fillStyle='rgba(94,139,126,0.35)'; ctx.fill();
        }
      });
      packets.forEach(p=>{
        p.progress+=p.speed;
        if(p.progress>=1){
          const s=nodes[p.dst];
          if(s&&s.edges.length>0){const ni=s.edges[Math.floor(Math.random()*s.edges.length)];p.src=p.dst;p.dst=ni;p.x=s.x;p.y=s.y;p.tx=nodes[ni].x;p.ty=nodes[ni].y;p.progress=0;p.speed=0.003+Math.random()*0.004;}
        }
      });
      frame++; animId=requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    const onResize=()=>{resize();init();}; window.addEventListener('resize',onResize);
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',onResize);};
  },[]);
  return <canvas ref={ref} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'block'}}/>;
}
