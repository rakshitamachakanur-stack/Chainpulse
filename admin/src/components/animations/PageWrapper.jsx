import { motion } from 'framer-motion';
const variants = {
  initial: { opacity:0, y:14 },
  animate: { opacity:1, y:0, transition:{ duration:0.22, ease:[0.16,1,0.3,1] } },
  exit:    { opacity:0, y:-8, transition:{ duration:0.15, ease:[0.4,0,1,1] } },
};
export default function PageWrapper({ children }) {
  return (
    <motion.div className="page-wrapper" variants={variants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
