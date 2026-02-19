import { motion } from 'framer-motion';

export default function PaymentCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card skeleton-shimmer p-4"
        >
          <div className="flex items-center gap-3">
            {/* Category icon placeholder */}
            <div className="w-10 h-10 rounded-xl bg-white/[0.07] flex-shrink-0" />

            {/* Text content */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-32 rounded-md bg-white/[0.08]" />
              <div className="h-3 w-20 rounded-md bg-white/[0.05]" />
            </div>

            {/* Right side: amount + ring */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="h-5 w-16 rounded-md bg-white/[0.08]" />
              <div className="w-8 h-8 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
