import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  format, isSameMonth, isSameDay, isBefore, startOfDay, addMonths, subMonths,
} from 'date-fns';
import type { Payment } from '@/hooks/usePayments';
import { getCategoryById } from '@/lib/categories';
import { useCurrency } from '@/hooks/useCurrency';
import PremiumLock from './PremiumLock';

interface PaymentCalendarProps {
  payments: Payment[];
  isPremium: boolean;
  onUpgrade: () => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PaymentCalendar({ payments, isPremium, onUpgrade }: PaymentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { format: formatCurrency } = useCurrency();

  const today = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const paymentsByDate = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    payments.forEach(p => {
      const key = p.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [payments]);

  const selectedPayments = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return paymentsByDate[key] || [];
  }, [selectedDate, paymentsByDate]);

  const getDots = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayPayments = paymentsByDate[key];
    if (!dayPayments) return [];
    return dayPayments.map(p => {
      if (p.is_paid) return 'bg-status-success';
      if (isBefore(new Date(p.due_date), today)) return 'bg-status-overdue';
      return 'bg-primary';
    }).slice(0, 3);
  };

  const handleDateClick = (day: Date) => {
    if (!isPremium) {
      onUpgrade();
      return;
    }
    setSelectedDate(prev => prev && isSameDay(prev, day) ? null : day);
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </motion.button>
        <p className="text-sm font-semibold text-card-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </p>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 relative">
        {calendarDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dots = getDots(day);

          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDateClick(day)}
              className={`relative flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                !isCurrentMonth ? 'opacity-30' : ''
              } ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''} ${
                isToday && !isSelected ? 'bg-secondary' : ''
              }`}
            >
              <span className={`text-xs font-medium ${
                isSelected ? 'text-primary font-bold' :
                isToday ? 'text-primary' :
                'text-card-foreground'
              }`}>
                {format(day, 'd')}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.map((dotClass, j) => (
                    <div key={j} className={`w-1 h-1 rounded-full ${dotClass}`} />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Premium lock overlay */}
        {!isPremium && (
          <PremiumLock
            title="Calendar View"
            subtitle="Tap dates to see payment details"
            onUpgrade={onUpgrade}
          />
        )}
      </div>

      {/* Selected date payments */}
      <AnimatePresence mode="wait">
        {isPremium && selectedDate && (
          <motion.div
            key={format(selectedDate, 'yyyy-MM-dd')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl bg-card border border-border/50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-xs font-semibold text-muted-foreground">
                {format(selectedDate, 'EEEE, MMMM d')}
              </p>
            </div>
            {selectedPayments.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Calendar className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No payments on this date</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {selectedPayments.map(p => {
                  const cat = getCategoryById(p.category || 'other');
                  const Icon = cat.icon;
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{p.name}</p>
                        <p className={`text-[11px] ${p.is_paid ? 'text-status-success' : 'text-muted-foreground'}`}>
                          {p.is_paid ? 'Paid' : 'Unpaid'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-card-foreground">{formatCurrency(Number(p.amount))}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
