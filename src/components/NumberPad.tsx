import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface NumberPadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export default function NumberPad({ onPress, onDelete, disabled }: NumberPadProps) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
      {keys.flat().map((key, i) => {
        if (key === '') return <div key={i} />;

        const isDel = key === 'del';

        return (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 0.85, backgroundColor: 'hsl(var(--muted))' }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            disabled={disabled}
            onClick={() => {
              haptic(10);
              if (isDel) onDelete();
              else onPress(key);
            }}
            className={`w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto transition-colors ${
              isDel
                ? 'bg-transparent'
                : 'bg-secondary/60'
            } disabled:opacity-40`}
          >
            {isDel ? (
              <Delete className="w-6 h-6 text-foreground" />
            ) : (
              <span className="text-[28px] font-light text-foreground tracking-tight">
                {key}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
