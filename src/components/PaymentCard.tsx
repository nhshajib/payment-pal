import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, RotateCw, Undo2, CheckCircle2, ChevronRight, ChevronLeft, Receipt, X } from 'lucide-react';
import { differenceInDays, parseISO, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { useCurrency } from '@/hooks/useCurrency';
import { getCategoryById } from '@/lib/categories';
import { haptic } from '@/lib/haptics';
import SwipeTutorialOverlay, { shouldShowSwipeTutorial, markSwipeTutorialDone } from './SwipeTutorialOverlay';

interface Props {
  payment: Payment;
  index: number;
  onMarkPaid: (payment: Payment) => void;
  onMarkUnpaid?: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  isPaidTab?: boolean;
  showSwipeTutorial?: boolean;
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

export default function PaymentCard({ payment, index, onMarkPaid, onMarkUnpaid, onEdit, onDelete, isPaidTab, showSwipeTutorial, receiptData, onReceiptTap }: Props) {
  const { format: formatCurrency } = useCurrency();
  const rawX = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 500, damping: 35 });
  const [showMenu, setShowMenu] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(() => !!showSwipeTutorial && shouldShowSwipeTutorial());
  const cardRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [hapticFiredRight, setHapticFiredRight] = useState(false);
  const [hapticFiredLeft, setHapticFiredLeft] = useState(false);

  const daysLeft = differenceInDays(parseISO(payment.due_date), new Date());
  const isUrgent = !payment.is_paid && (daysLeft < 0 || daysLeft <= 3);
  const isOverdue = !payment.is_paid && daysLeft < 0;

  const rightIconScale = useTransform(rawX, [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], [0.4, 0.9, 1.15]);
  const rightBgOpacity = useTransform(rawX, [0, 40, SWIPE_THRESHOLD], [0, 0.4, 1]);
  const leftBgOpacity = useTransform(rawX, [DELETE_THRESHOLD, EDIT_THRESHOLD, -20, 0], [1, 0.8, 0.3, 0]);
  const editIconScale = useTransform(rawX, [EDIT_THRESHOLD, -30, 0], [1.1, 0.6, 0.3]);
  const deleteIconScale = useTransform(rawX, [DELETE_THRESHOLD, EDIT_THRESHOLD, 0], [1.15, 0.7, 0.3]);

  const category = getCategoryById(payment.category || 'other');
  const CategoryIcon = category.icon;

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
  };

  const handleCardTap = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current && !showMenu) {
      haptic(15);
      setShowMenu(true);
    }
  }, [showMenu]);

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: payment.is_paid ? 120 : -120, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ delay: index * 0.01, duration: 0.15 }}
      className="relative overflow-visible"
      onClick={handleCardTap}
    >
      {/* Swipe right — mark paid */}
      {!payment.is_paid && (
        <motion.div
          className="absolute inset-0 rounded-2xl flex items-center pl-5"
          style={{ opacity: rightBgOpacity, background: 'hsl(var(--primary))' }}
        >
          <motion.div style={{ scale: rightIconScale }}>
            <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        </motion.div>
      )}

      {/* Swipe left — edit + delete */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-end pr-4 gap-5"
        style={{ opacity: leftBgOpacity }}
      >
        <motion.div style={{ scale: editIconScale }}>
          <Pencil className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
        </motion.div>
        <motion.div style={{ scale: deleteIconScale }}>
          <Trash2 className="w-5 h-5 text-destructive" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x: rawX }}
        className="relative rounded-2xl mono-card px-4 py-4 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-3.5">
          {/* Circular icon */}
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 mono-card-solid">
            <CategoryIcon className="w-[18px] h-[18px] text-muted-foreground" />
          </div>

          {/* Name + date */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className={`font-semibold text-[15px] tracking-tight truncate ${payment.is_paid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {payment.name}
              </h3>
              {payment.is_recurring && <RotateCw className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />}
            </div>
            <p className={`text-[13px] mt-0.5 ${isOverdue ? 'text-primary font-medium' : isUrgent ? 'text-primary' : 'text-muted-foreground'}`}>
              {getRelativeDate(payment.due_date)}
              {isOverdue && ' · Overdue'}
            </p>
          </div>

          {/* Amount + receipt */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-[17px] font-bold tracking-tight leading-none ${payment.is_paid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {formatCurrency(Number(payment.amount))}
            </span>
            {isPaidTab && receiptData && (
              <button
                onClick={(e) => { e.stopPropagation(); onReceiptTap?.(payment.id); }}
                className="p-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="fixed inset-0 z-[80] bg-background/60 backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
              onPointerDown={(e) => { e.stopPropagation(); setShowMenu(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute z-[90] min-w-[170px] left-1/2 -translate-x-1/2"
              style={{ top: '50%' }}
            >
              <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/25 overflow-hidden py-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => { setShowMenu(false); haptic(15); item.action(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-card-foreground hover:bg-secondary/80 active:bg-secondary transition-colors"
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </button>
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
