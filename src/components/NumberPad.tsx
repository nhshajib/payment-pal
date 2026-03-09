import { motion } from 'framer-motion';
import { Delete, Fingerprint } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface NumberPadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  showBiometric?: boolean;
  onBiometric?: () => void;
}

const LETTERS: Record<string, string> = {
  '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
  '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
};

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'del'],
];

export default function NumberPad({ onPress, onDelete, disabled, showBiometric, onBiometric }: NumberPadProps) {
  return (
    <div className="grid grid-cols-3 gap-[14px] max-w-[290px] mx-auto">
      {keys.flat().map((key, i) => {
        if (key === 'bio') {
          if (showBiometric && onBiometric) {
            return (
              <motion.button
                key={i}
                type="button"
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                disabled={disabled}
                onClick={() => { haptic(8); onBiometric(); }}
                className="w-[78px] h-[78px] rounded-full flex items-center justify-center mx-auto bg-transparent active:bg-white/[0.06] transition-colors disabled:opacity-40"
              >
                <Fingerprint className="w-7 h-7 text-white/60" />
              </motion.button>
            );
          }
          return <div key={i} className="w-[78px] h-[78px]" />;
        }

        const isDel = key === 'del';

        return (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 0.88, backgroundColor: 'rgba(255,255,255,0.15)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            disabled={disabled}
            onClick={() => {
              haptic(8);
              if (isDel) onDelete();
              else onPress(key);
            }}
            className={`w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center mx-auto transition-colors ${
              isDel
                ? 'bg-transparent active:bg-white/[0.06]'
                : 'bg-white/[0.07] backdrop-blur-sm active:bg-white/[0.14]'
            } disabled:opacity-40`}
          >
            {isDel ? (
              <Delete className="w-6 h-6 text-white/70" />
            ) : (
              <>
                <span className="text-[28px] font-light text-white tracking-tight leading-none">
                  {key}
                </span>
                {LETTERS[key] && (
                  <span className="text-[9px] font-semibold text-white/30 tracking-[0.18em] leading-none mt-0.5">
                    {LETTERS[key]}
                  </span>
                )}
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
