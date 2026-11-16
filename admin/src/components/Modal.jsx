import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, size='md' }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  const sizes = { sm:'420px', md:'560px', lg:'720px' };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}
          style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{position:'absolute',inset:0,background:'rgba(6,12,10,0.78)',backdropFilter:'blur(6px)'}} onClick={onClose}/>
          <motion.div initial={{opacity:0,y:20,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:10,scale:0.97}} transition={{duration:0.2,ease:[0.16,1,0.3,1]}}
            style={{position:'relative',width:'100%',maxWidth:sizes[size],background:'rgba(14,22,18,0.97)',border:'1px solid rgba(94,139,126,0.22)',borderRadius:20,boxShadow:'0 32px 80px rgba(0,0,0,0.6)',maxHeight:'90vh',display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:'1px solid rgba(94,139,126,0.1)',flexShrink:0}}>
              <h2 style={{fontSize:16,fontWeight:700,color:'#F8F4EC',letterSpacing:'-0.01em'}}>{title}</h2>
              <button onClick={onClose} style={{width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,background:'rgba(94,139,126,0.1)',border:'none',cursor:'pointer',color:'rgba(212,207,196,0.6)',fontSize:18,lineHeight:1}}>×</button>
            </div>
            <div style={{overflowY:'auto',flex:1,padding:'20px 24px'}}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
