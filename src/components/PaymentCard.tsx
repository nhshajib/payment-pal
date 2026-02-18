import { motion } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';

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

export default function PaymentCard({ payment, index, onMarkPaid, onEdit, onDelete }: Props) {
  const status = getStatus(payment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-card rounded-lg border-l-4 ${statusColors[status]} p-4 ${
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
            ₹{Number(payment.amount).toLocaleString()} · {payment.due_date}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColors[status]}`}>
            {getDaysLabel(payment)}
          </span>

          {!payment.is_paid && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onMarkPaid(payment)}
              className="w-8 h-8 rounded-full bg-status-success/20 flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-status-success" />
            </motion.button>
          )}

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
  );
}
