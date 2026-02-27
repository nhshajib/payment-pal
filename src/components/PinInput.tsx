import { motion } from 'framer-motion';

interface PinInputProps {
  length: number;
  filled: number;
  error?: boolean;
}

export default function PinInput({ length, filled, error }: PinInputProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-5"
      animate={error ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {Array.from({ length }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[14px] h-[14px] rounded-full transition-all duration-150 ${
            error
              ? 'bg-white'
              : i < filled
              ? 'bg-white'
              : 'border-2 border-white/25'
          }`}
          animate={
            error
              ? { scale: [1, 1.3, 1] }
              : i < filled
              ? { scale: [0.8, 1.15, 1] }
              : {}
          }
          transition={{ duration: 0.15 }}
        />
      ))}
    </motion.div>
  );
}
