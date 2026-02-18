import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw, Undo2, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { differenceInDays, parseISO, format, isToday, isTomorrow, isYesterday, addDays, isSameWeek } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { getCategoryById } from '@/lib/categories';
import { haptic } from '@/lib/haptics';

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

/** Human-friendly relative date label */
function getRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  const days = differenceInDays(date, new Date());
  if (days > 0 && days <= 6) return format(date, 'EEEE'); // "Monday", "Tuesday"
  return format(date, 'MMM d'); // "Feb 20"
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

const SWIPE_THRESHOLD = 100;
const EDIT_THRESHOLD = -60;
const DELETE_THRESHOLD = -140;
const LONG_PRESS_MS = 500;
const HINT_KEY = 'paytrack_swipe_hint_seen';

export default function PaymentCard({ payment, index, onMarkPaid, onMarkUnpaid, onEdit, onDelete, isPaidTab }: Props) {
  const { format: formatCurrency } = useCurrency();
  const status = getStatus(payment);
  const rawX = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 500, damping: 35 });
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [showHint, setShowHint] = useState(false);
  const [hapticFiredRight, setHapticFiredRight] = useState(false);
  const [hapticFiredLeft, setHapticFiredLeft] = useState(false);

  useEffect(() => {
    if (index === 0 && !localStorage.getItem(HINT_KEY)) {
      setShowHint(true);
      const t = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem(HINT_KEY, '1');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [index]);

  // Swipe background transforms
  const rightIconScale = useTransform(rawX, [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], [0.4, 0.9, 1.15]);
  const rightBgOpacity = useTransform(rawX, [0, 40, SWIPE_THRESHOLD], [0, 0.4, 1]);

  // Left swipe: two zones - edit and delete
  const leftBgOpacity = useTransform(rawX, [DELETE_THRESHOLD, EDIT_THRESHOLD, -20, 0], [1, 0.8, 0.3, 0]);
  const editIconScale = useTransform(rawX, [EDIT_THRESHOLD, -30, 0], [1.1, 0.6, 0.3]);
  const deleteIconScale = useTransform(rawX, [DELETE_THRESHOLD, EDIT_THRESHOLD, 0], [1.15, 0.7, 0.3]);

  const cardScale = useTransform(rawX, [-DELETE_THRESHOLD, 0, SWIPE_THRESHOLD], [0.97, 1, 0.97]);
  const cardShadow = useTransform(
    rawX,
    [-DELETE_THRESHOLD, 0, SWIPE_THRESHOLD],
    ['0 2px 8px hsl(0 0% 0% / 0.1)', '0 4px 20px hsl(0 0% 0% / 0.15)', '0 2px 8px hsl(0 0% 0% / 0.1)']
  );

  const category = getCategoryById(payment.category || 'other');
  const CategoryIcon = category.icon;

  // Haptic on crossing thresholds
  useEffect(() => {
    const unsubscribe = rawX.on('change', (v) => {
      if (v >= SWIPE_THRESHOLD && !hapticFiredRight) {
        haptic(25);
        setHapticFiredRight(true);
      } else if (v < SWIPE_THRESHOLD) {
        setHapticFiredRight(false);
      }
      if (v <= DELETE_THRESHOLD && !hapticFiredLeft) {
        haptic(25);
        setHapticFiredLeft(true);
      } else if (v > DELETE_THRESHOLD) {
        setHapticFiredLeft(false);
      }
    });
    return unsubscribe;
  }, [rawX, hapticFiredRight, hapticFiredLeft]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    isDragging.current = false;
    if (!payment.is_paid && info.offset.x >= SWIPE_THRESHOLD) {
      if (!localStorage.getItem(HINT_KEY)) localStorage.setItem(HINT_KEY, '1');
      setShowHint(false);
      haptic(30);
      onMarkPaid(payment);
    } else if (info.offset.x <= DELETE_THRESHOLD) {
      haptic(30);
      onDelete(payment.id);
    } else if (info.offset.x <= EDIT_THRESHOLD && info.offset.x > DELETE_THRESHOLD) {
      haptic(20);
      onEdit(payment);
    }
  };

  const handleDragStart = () => {
    isDragging.current = true;
    cancelLongPress();
    if (showHint) {
      setShowHint(false);
      localStorage.setItem(HINT_KEY, '1');
    }
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
        haptic(30);
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
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: payment.is_paid ? 120 : -120, scale: 0.92, transition: { duration: 0.3 } }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className="relative overflow-visible rounded-2xl"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Swipe right background (mark paid) */}
      {!payment.is_paid && (
        <motion.div
          className="absolute inset-0 rounded-2xl flex items-center pl-5"
          style={{
            opacity: rightBgOpacity,
            background: 'linear-gradient(100deg, hsl(152 69% 40% / 0.3) 0%, hsl(152 69% 40% / 0.08) 100%)',
          }}
        >
          <motion.div style={{ scale: rightIconScale }} className="flex items-center gap-2 text-status-success">
            <Check className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-sm font-bold tracking-tight">Paid</span>
          </motion.div>
        </motion.div>
      )}

      {/* Swipe left background (edit + delete) */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-4 gap-4"
        style={{
          opacity: leftBgOpacity,
          background: 'linear-gradient(260deg, hsl(0 72% 51% / 0.15) 0%, hsl(200 80% 55% / 0.1) 60%, transparent 100%)',
        }}
      >
        <motion.div style={{ scale: editIconScale }} className="flex items-center gap-1.5 text-primary">
          <Pencil className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-xs font-bold">Edit</span>
        </motion.div>
        <motion.div style={{ scale: deleteIconScale }} className="flex items-center gap-1.5 text-destructive">
          <Trash2 className="w-4 h-4" strokeWidth={2.5} />
          <span className="text-xs font-bold">Delete</span>
        </motion.div>
      </motion.div>

      {/* Card content - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: rawX, scale: cardScale, boxShadow: cardShadow }}
        whileTap={{ scale: 0.975 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={`relative bg-card border-l-[3px] ${statusColors[status]} p-4 cursor-grab active:cursor-grabbing rounded-2xl`}
      >
        {/* Swipe hint arrows (first-time only) */}
        <AnimatePresence>
          {showHint && !payment.is_paid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none z-10"
            >
              <motion.div
                animate={{ x: [-2, -8, -2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-6 h-6 rounded-full bg-destructive/15 flex items-center justify-center"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-destructive" />
              </motion.div>
              <motion.div
                animate={{ x: [2, 8, 2] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-6 h-6 rounded-full bg-status-success/15 flex items-center justify-center"
              >
                <ChevronRight className="w-3.5 h-3.5 text-status-success" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Category icon with glow */}
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${category.color}15`,
                boxShadow: `0 0 16px ${category.color}20, 0 0 4px ${category.color}10`,
              }}
            >
              <CategoryIcon className="w-[18px] h-[18px]" style={{ color: category.color }} />
            </motion.div>

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
                {formatCurrency(Number(payment.amount))} · {getRelativeDate(payment.due_date)}
              </p>
              {payment.notes ? (
                <p className={`text-muted-foreground/70 text-xs mt-1 truncate ${payment.is_paid ? 'opacity-50' : ''}`}>
                  {payment.notes}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <motion.span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColors[status]}`}
              animate={status === 'overdue' ? {
                scale: [1, 1.06, 1],
                boxShadow: ['0 0 0 0 hsl(0 84% 60% / 0)', '0 0 8px 2px hsl(0 84% 60% / 0.25)', '0 0 0 0 hsl(0 84% 60% / 0)'],
              } : {}}
              transition={status === 'overdue' ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
              onPointerDown={() => setShowMenu(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="absolute z-[90] min-w-[170px]"
              style={{
                left: Math.min(menuPos.x, 200),
                top: menuPos.y + 8,
              }}
            >
              <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/25 overflow-hidden py-1">
                {menuItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => {
                        setShowMenu(false);
                        haptic(15);
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
