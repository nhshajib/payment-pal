import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export default function PageTransition({ children }: Props) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1"
    >
      {children}
    </motion.div>
  );
}
