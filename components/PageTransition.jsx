'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1,    filter: 'blur(0px)' }}
        exit={{    opacity: 0, scale: 1.01, filter: 'blur(8px)' }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'center' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
