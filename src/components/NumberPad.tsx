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
    <div className="grid grid-cols-3 gap-3 max-w-[264px] mx-auto">
      {keys.flat().map((key, i) => {
        if (key === '') return <div key={i} />;

        const isDel = key === 'del';

        return (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 0.88, backgroundColor: 'rgba(255,255,255,0.12)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            disabled={disabled}
            onClick={() => {
              haptic(8);
              if (isDel) onDelete();
              else onPress(key);
            }}
            className={`w-[76px] h-[76px] rounded-full flex items-center justify-center mx-auto transition-colors ${
              isDel
                ? 'bg-transparent'
                : 'bg-white/[0.06]'
            } disabled:opacity-40`}
          >
            {isDel ? (
              <Delete className="w-6 h-6 text-white/70" />
            ) : (
              <span className="text-[30px] font-light text-white tracking-tight">
                {key}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
