import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, AlertCircle, ExternalLink } from 'lucide-react';
import { getCategoryById } from '@/lib/categories';
import { useCurrency } from '@/hooks/useCurrency';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { cn } from '@/lib/utils';

interface Props {
  payment: Payment;
  onTap: (payment: Payment) => void;
  onSwipePay: (payment: Payment) => void;
  partialAmount?: number;
  isVariable?: boolean;
}

function getRelativeLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export default function BillItem({ payment, onTap, onSwipePay, partialAmount = 0, isVariable }: Props) {
  const { format: formatCurrency } = useCurrency();
  const cat = getCategoryById(payment.category || 'other');
  const Icon = cat.icon;
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);
  const checkScale = useTransform(x, [-120, -60, 0], [1, 0.5, 0]);

  const isFreeTrial = payment.category === 'free_trial';
  const daysLeft = differenceInDays(parseISO(payment.due_date), new Date());
  const isShared = payment.isShared && payment.userShareAmount != null;

  // Determine display amount
  const displayAmount = isShared ? (payment.userShareAmount ?? payment.amount) : payment.amount;
  const remaining = displayAmount - partialAmount;
  const isPartial = partialAmount > 0;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      onSwipePay(payment);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe-to-pay background */}
      <motion.div
        className="absolute inset-0 bg-status-success flex items-center justify-end pr-6 rounded-2xl"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: checkScale }}>
          <Check className="w-6 h-6 text-primary-foreground" />
        </motion.div>
      </motion.div>

      {/* Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onTap(payment)}
        className={cn(
          "relative bg-card rounded-2xl px-4 py-3.5 flex items-center gap-3.5 cursor-pointer active:bg-secondary/30 transition-colors touch-pan-y",
          isFreeTrial && "free-trial-pulse"
        )}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cat.color}12` }}
        >
          <Icon className="w-5 h-5" style={{ color: cat.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-card-foreground truncate">{payment.name}</p>
            {/* Pay Portal Link */}
            {payment.paymentUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(payment.paymentUrl, '_blank', 'noopener,noreferrer');
                }}
                className="p-1 rounded-md hover:bg-secondary/60 transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{getRelativeLabel(payment.due_date)}</p>
          {/* Shared bill secondary text */}
          {isShared && payment.totalAmount != null && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Total Bill: {formatCurrency(payment.totalAmount)}
            </p>
          )}
        </div>

        {/* Amount / Status */}
        <div className="text-right flex-shrink-0">
          {isVariable ? (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-status-warning" />
              <span className="text-sm font-semibold text-status-warning">TBD</span>
            </div>
          ) : (
            <>
              <p className={cn(
                'text-sm font-bold',
                isPartial ? 'text-status-warning' : 'text-card-foreground'
              )}>
                {formatCurrency(remaining)}
              </p>
              {isPartial && (
                <p className="text-[10px] text-status-success font-medium mt-0.5">
                  Partially Paid
                </p>
              )}
            </>
          )}
          {/* Free Trial countdown badge */}
          {isFreeTrial && daysLeft >= 0 && daysLeft <= 14 && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[hsl(25,95%,53%)]/15 text-[hsl(25,95%,53%)]">
              {daysLeft === 0 ? 'Ends today' : `Ends in ${daysLeft}d`}
            </span>
          )}
        </div>

        {/* Quick pay button */}
        {!isVariable && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onSwipePay(payment);
            }}
            className="w-8 h-8 rounded-full bg-status-success/10 flex items-center justify-center flex-shrink-0"
          >
            <Check className="w-4 h-4 text-status-success" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
