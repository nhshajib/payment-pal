import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw, ChevronRight } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  payment: Payment;
  index: number;
  onMarkPaid: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
}

function getStatus(payment: Payment) {
  if (payment.is_paid) return 'paid';
  const daysLeft = differenceInDays(parseISO(payment.due_date), new Date());
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= payment.reminder_days) return 'warning';
  return 'upcoming';
}

function getDaysLabel(payment: Payment) {
  if (payment.is_paid) return 'Paid';
  const daysLeft = differenceInDays(parseISO(payment.due_date), new Date());
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return 'Due today';
  return `${daysLeft}d left`;
}

const statusColors = {
  paid: 'border-muted',
  overdue: 'border-status-overdue',
  warning: 'border-status-warning',
  upcoming: 'border-status-success',
};

const badgeColors = {
  paid: 'bg-muted text-muted-foreground',
  overdue: 'bg-status-overdue/20 text-status-overdue',
  warning: 'bg-status-warning/20 text-status-warning',
  upcoming: 'bg-status-success/20 text-status-success',
};

const SWIPE_THRESHOLD = 120;

export default function PaymentCard({ payment, index, onMarkPaid, onEdit, onDelete }: Props) {
  const { format: formatCurrency } = useCurrency();
  const status = getStatus(payment);
  const x = useMotionValue(0);
  const backgroundOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const checkScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);
  const [swiped, setSwiped] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x >= SWIPE_THRESHOLD && !payment.is_paid) {
      setSwiped(true);
      onMarkPaid(payment);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-lg"
    >
      {/* Swipe background */}
      {!payment.is_paid && (
        <motion.div
          className="absolute inset-0 bg-status-success/20 flex items-center pl-5 rounded-lg"
          style={{ opacity: backgroundOpacity }}
        >
          <motion.div style={{ scale: checkScale }} className="flex items-center gap-2 text-status-success">
            <Check className="w-6 h-6" />
            <span className="text-sm font-semibold">Paid</span>
          </motion.div>
        </motion.div>
      )}

      {/* Card content - draggable */}
      <motion.div
        drag={!payment.is_paid ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        className={`relative bg-card border-l-4 ${statusColors[status]} p-4 cursor-grab active:cursor-grabbing ${
          payment.is_paid ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-card-foreground truncate ${payment.is_paid ? 'line-through' : ''}`}>
                {payment.name}
              </h3>
              {payment.is_recurring && (
                <RotateCw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {formatCurrency(Number(payment.amount))} · {payment.due_date}
            </p>
            {!payment.is_paid && (
              <p className="text-muted-foreground/50 text-xs mt-1 flex items-center gap-1">
                <ChevronRight className="w-3 h-3" /> Swipe right to mark paid
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColors[status]}`}>
              {getDaysLabel(payment)}
            </span>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onEdit(payment)}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onDelete(payment.id)}
              className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
