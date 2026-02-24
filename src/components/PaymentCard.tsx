import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw, Undo2, CheckCircle2, ChevronRight, ChevronLeft, Receipt } from 'lucide-react';
import { differenceInDays, parseISO, format, isToday, isTomorrow, isYesterday } from 'date-fns';
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
  receiptData?: { confirmationNumber?: string; receiptImage?: string };
  onReceiptTap?: (paymentId: string) => void;
}

function getRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  const days = differenceInDays(date, new Date());
  if (days > 0 && days <= 6) return format(date, 'EEEE');
  return format(date, 'MMM d');
}

const SWIPE_THRESHOLD = 100;
const EDIT_THRESHOLD = -50;
const DELETE_THRESHOLD = -140;
const LONG_PRESS_MS = 500;
const HINT_KEY = 'paytrack_swipe_hint_seen';

function DaysRing({ payment }: { payment: Payment }) {
  const daysLeft = differenceInDays(parseISO(payment.due_date), new Date());
  const MAX_DAYS = 30;
  const progress = payment.is_paid ? 1 : Math.max(0, Math.min(1, daysLeft / MAX_DAYS));
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  let ringColor: string;
  if (payment.is_paid) {
    ringColor = '#9ca3af';
  } else if (daysLeft < 0 || daysLeft < 7) {
    ringColor = '#ef4444';
  } else if (daysLeft < 14) {
    ringColor = '#f59e0b';
  } else {
    ringColor = '#10b981';
  }

  const label = payment.is_paid
    ? '✓'
    : daysLeft < 0
    ? `${Math.abs(daysLeft)}d`
    : daysLeft === 0
    ? 'Now'
    : `${daysLeft}d`;

  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <svg width="32" height="32" viewBox="0 0 32 32" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="16" cy="16" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
        <circle
          cx="16" cy="16" r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[9px] font-bold relative z-10 leading-none" style={{ color: ringColor }}>
        {label}
      </span>
    </div>
  );
}

export default function PaymentCard({ payment, index, onMarkPaid, onMarkUnpaid, onEdit, onDelete, isPaidTab, receiptData, onReceiptTap }: Props) {
  const { format: formatCurrency } = useCurrency();
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

  const rightIconScale = useTransform(rawX, [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], [0.4, 0.9, 1.15]);
  const rightBgOpacity = useTransform(rawX, [0, 40, SWIPE_THRESHOLD], [0, 0.4, 1]);

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
  const isFreeTrial = payment.category === 'free_trial';
  const daysLeft = differenceInDays(parseISO(payment.due_date), new Date());

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
      { label: 'Edit', icon: Pencil, color: 'text-blue-400', action: () => onEdit(payment) },
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
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-4 gap-5"
        style={{
          opacity: leftBgOpacity,
          background: 'linear-gradient(260deg, hsl(0 72% 51% / 0.15) 0%, hsl(210 80% 55% / 0.12) 60%, transparent 100%)',
        }}
      >
        <motion.div style={{ scale: editIconScale }} className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15">
            <Pencil className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
            <span className="text-sm font-bold text-blue-400">Edit</span>
          </div>
        </motion.div>
        <motion.div style={{ scale: deleteIconScale }} className="flex items-center gap-1.5 text-destructive">
          <Trash2 className="w-5 h-5" strokeWidth={2.5} />
          <span className="text-sm font-bold">Delete</span>
        </motion.div>
      </motion.div>

      {/* Card content - draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: rawX, scale: cardScale, boxShadow: cardShadow, borderLeft: `3px solid ${category.color}30` }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={`relative glass-card px-4 py-3.5 cursor-grab active:cursor-grabbing ${isFreeTrial && !payment.is_paid ? 'free-trial-pulse' : ''}`}
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

        <div className="flex items-center gap-3">
          {/* Gradient pill category icon */}
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${category.color}22 0%, ${category.color}0d 100%)`,
              boxShadow: `0 0 18px ${category.color}1a, inset 0 1px 0 ${category.color}26`,
              border: `1px solid ${category.color}22`,
            }}
          >
            <CategoryIcon className="w-[18px] h-[18px]" style={{ color: category.color }} />
          </motion.div>

          {/* Center: Name + date + notes */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={`font-semibold text-[15px] text-card-foreground truncate ${payment.is_paid ? 'line-through opacity-40' : ''}`}>
                {payment.name}
              </h3>
              {payment.is_recurring && (
                <RotateCw className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <p className={`text-muted-foreground text-[12px] mt-0.5 ${payment.is_paid ? 'opacity-40' : ''}`}>
              {getRelativeDate(payment.due_date)}
            </p>
            {payment.notes ? (
              <p className={`text-muted-foreground/60 text-[11px] mt-0.5 truncate ${payment.is_paid ? 'opacity-40' : ''}`}>
                {payment.notes}
              </p>
            ) : null}
          </div>

          {/* Right: Amount + Days ring */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-[17px] font-bold tracking-tight leading-none ${
              payment.is_paid ? 'text-muted-foreground line-through opacity-50' : 'text-card-foreground'
            }`}>
              {formatCurrency(Number(payment.amount))}
            </span>
            {isFreeTrial && !payment.is_paid && daysLeft >= 0 && daysLeft <= 14 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-[hsl(25,95%,53%)]/15 text-[hsl(25,95%,53%)]">
                {daysLeft === 0 ? 'Ends today' : `Ends in ${daysLeft}d`}
              </span>
            )}
            {isPaidTab && receiptData && (
              <button
                onClick={(e) => { e.stopPropagation(); onReceiptTap?.(payment.id); }}
                className="p-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
            <DaysRing payment={payment} />
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
