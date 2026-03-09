import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_TUTORIAL_KEY = 'paytrack_swipe_tutorial_done';

export function shouldShowSwipeTutorial(): boolean {
  return !localStorage.getItem(SWIPE_TUTORIAL_KEY);
}

export function markSwipeTutorialDone() {
  localStorage.setItem(SWIPE_TUTORIAL_KEY, 'true');
}

export default function SwipeTutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [phase, setPhase] = useState<'right' | 'left' | null>('right');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('left'), 1800);
    const t2 = setTimeout(() => {
      markSwipeTutorialDone();
      onDismiss();
    }, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <AnimatePresence mode="wait">
        {phase === 'right' && (
          <motion.div
            key="right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-2xl bg-primary/15 backdrop-blur-[2px] flex items-center justify-center"
          >
            <motion.div
              className="flex items-center gap-2 text-primary"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 20, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut', repeat: 1, repeatType: 'reverse' }}
            >
              <Check className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-xs font-semibold">Swipe to mark paid</span>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
        {phase === 'left' && (
          <motion.div
            key="left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-2xl bg-destructive/10 backdrop-blur-[2px] flex items-center justify-center"
          >
            <motion.div
              className="flex items-center gap-2 text-muted-foreground"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: -20, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut', repeat: 1, repeatType: 'reverse' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-semibold">Swipe to edit or delete</span>
              <Pencil className="w-4 h-4 text-blue-400" />
              <Trash2 className="w-4 h-4 text-destructive" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
