import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw, Undo2, CheckCircle2 } from 'lucide-react';
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
const DELETE_THRESHOLD = -120;
const LONG_PRESS_MS = 500;

export default function PaymentCard({ payment, index, onMarkPaid, onMarkUnpaid, onEdit, onDelete, isPaidTab }: Props) {
  const { format: formatCurrency } = useCurrency();
  const status = getStatus(payment);
  const x = useMotionValue(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1.2]);
  const leftBgOpacity = useTransform(x, [DELETE_THRESHOLD, 0], [1, 0]);
  const leftIconScale = useTransform(x, [DELETE_THRESHOLD, 0], [1.2, 0.5]);

  const category = getCategoryById(payment.category || 'other');
  const CategoryIcon = category.icon;

  const handleDragEnd = (_: any, info: PanInfo) => {
    isDragging.current = false;
    if (!payment.is_paid && info.offset.x >= SWIPE_THRESHOLD) {
      onMarkPaid(payment);
    } else if (info.offset.x <= DELETE_THRESHOLD) {
      onDelete(payment.id);
    }
  };

  const handleDragStart = () => {
    isDragging.current = true;
    cancelLongPress();
  };

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    const posX = e.clientX - (rect?.left || 0);
    const posY = e.clientY - (rect?.top || 0);

    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        // Vibrate for haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(30);
        setMenuPos({ x: posX, y: posY });
        setShowMenu(true);
      }
    }, LONG_PRESS_MS);
  }, []);

  const handlePointerUp = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  const menuItems = [
    ...(!payment.is_paid ? [
      { label: 'Mark Paid', icon: CheckCircle2, color: 'text-status-success', action: () => onMarkPaid(payment) },
      { label: 'Edit', icon: Pencil, color: 'text-muted-foreground', action: () => onEdit(payment) },
    ] : []),
    ...(payment.is_paid && onMarkUnpaid ? [
      { label: 'Mark Unpaid', icon: Undo2, color: 'text-status-warning', action: () => onMarkUnpaid(payment) },
    ] : []),
    { label: 'Delete', icon: Trash2, color: 'text-destructive', action: () => onDelete(payment.id) },
  ];

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: payment.is_paid ? 100 : -100, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 350, damping: 28 }}
      className="relative overflow-visible rounded-xl"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Swipe right background (mark paid) */}
      {!payment.is_paid && (
        <motion.div
          className="absolute inset-0 rounded-xl flex items-center pl-5"
          style={{
            opacity: rightBgOpacity,
            background: 'linear-gradient(90deg, hsl(152, 69%, 40%, 0.25), hsl(152, 69%, 40%, 0.1))',
          }}
        >
          <motion.div style={{ scale: rightIconScale }} className="flex items-center gap-2 text-status-success">
            <Check className="w-6 h-6" />
            <span className="text-sm font-semibold">Paid</span>
          </motion.div>
        </motion.div>
      )}

      {/* Swipe left background (delete) */}
      <motion.div
        className="absolute inset-0 rounded-xl flex items-center justify-end pr-5"
        style={{
          opacity: leftBgOpacity,
          background: 'linear-gradient(270deg, hsl(0, 72%, 51%, 0.25), hsl(0, 72%, 51%, 0.1))',
        }}
      >
        <motion.div style={{ scale: leftIconScale }} className="flex items-center gap-2 text-destructive">
          <span className="text-sm font-semibold">Delete</span>
          <Trash2 className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Card content - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`relative bg-card border-l-[3px] ${statusColors[status]} p-4 cursor-grab active:cursor-grabbing rounded-xl`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${category.color}15`,
                boxShadow: `0 0 12px ${category.color}15`,
              }}
            >
              <CategoryIcon className="w-[18px] h-[18px]" style={{ color: category.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-card-foreground truncate ${payment.is_paid ? 'line-through opacity-50' : ''}`}>
                  {payment.name}
                </h3>
                {payment.is_recurring && (
                  <RotateCw className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className={`text-muted-foreground text-sm mt-0.5 ${payment.is_paid ? 'opacity-50' : ''}`}>
                {formatCurrency(Number(payment.amount))} · {payment.due_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <motion.span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColors[status]}`}
              animate={status === 'overdue' ? { scale: [1, 1.05, 1] } : {}}
              transition={status === 'overdue' ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {getDaysLabel(payment)}
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Long-press context menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
              onPointerDown={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -5 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute z-[90] min-w-[160px]"
              style={{
                left: Math.min(menuPos.x, 200),
                top: menuPos.y + 8,
              }}
            >
              <div className="bg-card border border-border/60 rounded-xl shadow-2xl shadow-black/20 overflow-hidden py-1">
                {menuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => {
                        setShowMenu(false);
                        item.action();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-card-foreground hover:bg-secondary/80 active:bg-secondary transition-colors"
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
