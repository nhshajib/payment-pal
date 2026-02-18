import { motion } from 'framer-motion';

export default function PaymentCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-card rounded-2xl border-l-[3px] border-muted p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded-lg bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
