import { motion } from 'framer-motion';

interface PinInputProps {
  length: number;
  filled: number;
  error?: boolean;
}

export default function PinInput({ length, filled, error }: PinInputProps) {
  return (
    <motion.div
      className="flex items-center justify-center gap-6"
      animate={error ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {Array.from({ length }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[15px] h-[15px] rounded-full transition-all duration-150 ${
            error
              ? 'bg-red-500'
              : i < filled
              ? 'bg-white'
              : 'border-2 border-white/25'
          }`}
          animate={
            error
              ? { scale: [1, 1.3, 1] }
              : i < filled
              ? { scale: [0.7, 1.2, 1] }
              : {}
          }
          transition={{ duration: 0.15 }}
        />
      ))}
    </motion.div>
  );
}
