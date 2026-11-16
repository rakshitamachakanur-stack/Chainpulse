export default function NotFoundPage() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
      <p style={{ fontSize:72, fontWeight:800, color:'rgba(212,207,196,0.1)', fontFamily:'monospace' }}>404</p>
      <p style={{ color:'rgba(212,207,196,0.4)', fontSize:15 }}>Page not found</p>
    </div>
  );
}
