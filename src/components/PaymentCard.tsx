import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw, ChevronRight, ChevronLeft, Undo2 } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { getCategoryById } from '@/lib/categories';

interface Props {
  payment: Payment;
  index: number;
  onMarkPaid: (payment: Payment) => void;
  onMarkUnpaid?: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  isPaidTab?: boolean;
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

export default function PaymentCard({ payment, index, onMarkPaid, onMarkUnpaid, onEdit, onDelete, isPaidTab }: Props) {
  const { format: formatCurrency } = useCurrency();
  const status = getStatus(payment);
  const x = useMotionValue(0);

  // For unpaid: swipe right to mark paid
  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);

  // For paid: swipe left to mark unpaid
  const leftBgOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.5]);

  const category = getCategoryById(payment.category || 'other');
  const CategoryIcon = category.icon;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!payment.is_paid && info.offset.x >= SWIPE_THRESHOLD) {
      onMarkPaid(payment);
    } else if (payment.is_paid && info.offset.x <= -SWIPE_THRESHOLD && onMarkUnpaid) {
      onMarkUnpaid(payment);
    }
  };

  const canDrag = !payment.is_paid || isPaidTab;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: payment.is_paid ? 100 : -100 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-lg"
    >
      {/* Swipe right background (mark paid) */}
      {!payment.is_paid && (
        <motion.div
          className="absolute inset-0 bg-status-success/20 flex items-center pl-5 rounded-lg"
          style={{ opacity: rightBgOpacity }}
        >
          <motion.div style={{ scale: rightIconScale }} className="flex items-center gap-2 text-status-success">
            <Check className="w-6 h-6" />
            <span className="text-sm font-semibold">Paid</span>
          </motion.div>
        </motion.div>
      )}

      {/* Swipe left background (mark unpaid) */}
      {payment.is_paid && isPaidTab && (
        <motion.div
          className="absolute inset-0 bg-status-warning/20 flex items-center justify-end pr-5 rounded-lg"
          style={{ opacity: leftBgOpacity }}
        >
          <motion.div style={{ scale: leftIconScale }} className="flex items-center gap-2 text-status-warning">
            <span className="text-sm font-semibold">Unpaid</span>
            <Undo2 className="w-5 h-5" />
          </motion.div>
        </motion.div>
      )}

      {/* Card content - draggable */}
      <motion.div
        drag={canDrag ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.97 }}
        className={`relative bg-card border-l-4 ${statusColors[status]} p-4 cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Category icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon className="w-4.5 h-4.5" style={{ color: category.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-card-foreground truncate ${payment.is_paid ? 'line-through opacity-60' : ''}`}>
                  {payment.name}
                </h3>
                {payment.is_recurring && (
                  <RotateCw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className={`text-muted-foreground text-sm mt-0.5 ${payment.is_paid ? 'opacity-60' : ''}`}>
                {formatCurrency(Number(payment.amount))} · {payment.due_date}
              </p>
              {!payment.is_paid && (
                <p className="text-muted-foreground/50 text-xs mt-1 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" /> Swipe right to mark paid
                </p>
              )}
              {payment.is_paid && isPaidTab && (
                <p className="text-muted-foreground/50 text-xs mt-1 flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Swipe left to mark unpaid
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeColors[status]}`}>
              {getDaysLabel(payment)}
            </span>

            {!isPaidTab && (
              <motion.button
                whileTap={{ scale: 0.8, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                onClick={() => onEdit(payment)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center active:bg-secondary/80"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.8, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              onClick={() => onDelete(payment.id)}
              className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center active:bg-destructive/30"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
