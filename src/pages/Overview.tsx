import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Timer, Users, ExternalLink, XCircle, Trash2, ChevronRight, Sparkles, Crown } from 'lucide-react';
import { parseISO, format, differenceInDays, isAfter } from 'date-fns';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { useUser } from '@/hooks/useUser';
import { useCurrency } from '@/hooks/useCurrency';
import { usePaydays } from '@/hooks/usePaydays';
import { useFreeTrials } from '@/hooks/useFreeTrials';
import { usePremium } from '@/hooks/usePremium';
import PageTransition from '@/components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';

export default function Overview() {
  const { userId } = useUser();
  const { format: formatCurrency } = useCurrency();
  const { payments } = usePayments(userId);
  const { nextPayday } = usePaydays();
  const { isPremium } = usePremium();
  const { trials, fetchTrials, cancelTrial, deleteTrial } = useFreeTrials(userId);
  const navigate = useNavigate();

  useEffect(() => { if (userId) fetchTrials(); }, [userId, fetchTrials]);

  const unpaid = useMemo(() => payments.filter(p => !p.is_paid), [payments]);

  const paycheckSummary = useMemo(() => {
    if (!nextPayday) return null;
    const bills = unpaid.filter(p => !isAfter(parseISO(p.due_date), nextPayday));
    const total = bills.reduce((sum, p) => {
      const amt = p.is_shared && p.user_share_amount ? p.user_share_amount : p.amount;
      return sum + Number(amt);
    }, 0);
    return { count: bills.length, total, date: nextPayday };
  }, [nextPayday, unpaid]);

  const activeTrials = useMemo(() => trials.filter(t => !t.is_cancelled), [trials]);
  const sharedBills = useMemo(() => unpaid.filter(p => p.is_shared), [unpaid]);

  const stagger = (i: number) => ({ delay: 0.06 + i * 0.04 });

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-5 pt-8 max-w-md mx-auto">
        {/* ━━━ HEADER ━━━ */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-[13px] font-medium text-muted-foreground/50 uppercase tracking-[1.5px] mb-1">
            Your Financial
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-none">
            Insights
          </h1>
        </motion.header>

        {/* ━━━ SECTION 1: PAYCHECK SURVIVAL ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(0)}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4 ml-1">
            <Banknote className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground/60">
              Paycheck Survival
            </span>
          </div>

          <div className="rounded-2xl mono-card p-5">
            {paycheckSummary ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] text-muted-foreground/50 mb-1">
                      Next paycheck on
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {format(paycheckSummary.date, 'EEEE, MMM d')}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl mono-card-solid flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border/30">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {formatCurrency(paycheckSummary.total)}
                  </p>
                  <p className="text-[13px] text-muted-foreground/50 mt-1.5">
                    due before your next paycheck
                    <span className="text-muted-foreground/30"> · </span>
                    <span className="text-foreground font-medium">{paycheckSummary.count} bill{paycheckSummary.count !== 1 ? 's' : ''}</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground/50 text-sm">No payday configured</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/settings')}
                  className="mt-3 text-xs text-primary font-semibold"
                >
                  Set up in Settings →
                </motion.button>
              </div>
            )}
          </div>
        </motion.section>

        {/* ━━━ SECTION 2: ACTIVE FREE TRIALS ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(1)}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4 ml-1">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground/60" />
              <span className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground/60">
                Active Free Trials
              </span>
              {!isPremium && <Crown className="w-3 h-3 text-primary" />}
            </div>
            {activeTrials.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/schedule')}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/60"
              >
                See All <ChevronRight className="w-3 h-3" />
              </motion.button>
            )}
          </div>

          {!isPremium ? (
            <div className="rounded-2xl mono-card p-5 text-center">
              <Crown className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Premium Feature</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Track free trials & get expiry alerts</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toast('Upgrade to Premium for Free Trial Tracking', { icon: '👑' })}
                className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Unlock Premium
              </motion.button>
            </div>
          ) : activeTrials.length === 0 ? (
            <div className="rounded-2xl mono-card p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mono-card-solid mb-3">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <Sparkles className="w-5 h-5 text-muted-foreground/30" />
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground/50">No active free trials</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ maskImage: 'linear-gradient(to right, black 90%, transparent)' }}>
              {activeTrials.slice(0, 5).map((trial, i) => {
                const daysLeft = differenceInDays(parseISO(trial.expires_on), new Date());
                const isExpired = daysLeft < 0;
                const urgencyText = isExpired ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`;
                const isUrgent = isExpired || daysLeft <= 3;

                return (
                  <motion.div
                    key={trial.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-shrink-0 w-44 rounded-2xl mono-card p-4"
                  >
                    <div className="w-9 h-9 rounded-xl mono-card-solid flex items-center justify-center mb-3">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate mb-2">{trial.name}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {urgencyText}
                    </span>
                    <div className="flex gap-1.5 mt-3">
                      {trial.cancel_url && (
                        <motion.a
                          whileTap={{ scale: 0.9 }}
                          href={trial.cancel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg mono-card-solid flex items-center justify-center"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </motion.a>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { haptic(20); cancelTrial(trial.id); toast.success('Cancelled'); }}
                        className="w-7 h-7 rounded-lg mono-card-solid flex items-center justify-center"
                      >
                        <XCircle className="w-3 h-3 text-muted-foreground" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { haptic(20); deleteTrial(trial.id); toast.success('Deleted'); }}
                        className="w-7 h-7 rounded-lg mono-card-solid flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ━━━ SECTION 3: SHARED BILLS ━━━ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(2)}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4 ml-1">
            <Users className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground/60">
              Shared Bills
            </span>
          </div>

          {sharedBills.length === 0 ? (
            <div className="rounded-2xl mono-card p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mono-card-solid mb-3">
                <Users className="w-5 h-5 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground/50">No shared bills yet</p>
              <p className="text-xs text-muted-foreground/30 mt-1">Mark a bill as shared when adding it</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {sharedBills.map((bill, i) => {
                  const daysLeft = differenceInDays(parseISO(bill.due_date), new Date());
                  const isUrgent = daysLeft <= 3;

                  return (
                    <motion.div
                      key={bill.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-2xl mono-card px-4 py-4 flex items-center gap-3.5"
                    >
                      <div className="w-11 h-11 rounded-full mono-card-solid flex items-center justify-center flex-shrink-0">
                        <Users className="w-[18px] h-[18px] text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[15px] tracking-tight text-foreground truncate">
                          {bill.name}
                        </h3>
                        <p className={`text-[13px] mt-0.5 ${isUrgent ? 'text-primary' : 'text-muted-foreground/50'}`}>
                          Due {format(parseISO(bill.due_date), 'MMM d')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[17px] font-bold tracking-tight text-foreground leading-none">
                          {formatCurrency(Number(bill.user_share_amount || bill.amount))}
                        </span>
                        {bill.total_amount > 0 && bill.total_amount !== bill.user_share_amount && (
                          <span className="text-[11px] text-muted-foreground/40 mt-0.5">
                            of {formatCurrency(Number(bill.total_amount))}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* ━━━ EMPTY STATE ━━━ */}
        {!paycheckSummary && activeTrials.length === 0 && sharedBills.length === 0 && unpaid.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mono-card mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-semibold text-base">All clear!</p>
            <p className="text-muted-foreground/50 text-sm mt-1.5 max-w-[240px] mx-auto">
              Add payments and set up paydays to see your insights
            </p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
