import { motion } from 'framer-motion';
import { Lock, Crown } from 'lucide-react';

interface PremiumLockProps {
  title: string;
  subtitle?: string;
  onUpgrade: () => void;
  compact?: boolean;
}

export default function PremiumLock({ title, subtitle, onUpgrade, compact = false }: PremiumLockProps) {
  if (compact) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onUpgrade}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20"
      >
        <Crown className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">{title}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
      style={{
        background: 'hsl(var(--card) / 0.7)',
        backdropFilter: 'blur(8px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-card-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">{subtitle}</p>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onUpgrade}
          className="mt-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/25"
        >
          <Crown className="w-3 h-3 inline mr-1.5 -mt-0.5" />
          Unlock
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
