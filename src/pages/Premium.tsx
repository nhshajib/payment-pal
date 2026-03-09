import { useState, useEffect, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, ChevronLeft, Sparkles, Shield, Zap, Star, Gem } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePremium } from '@/hooks/usePremium';
import PageTransition from '@/components/PageTransition';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Confetti from '@/components/Confetti';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$0.99',
    period: '/mo',
    badge: null,
    icon: Zap,
    description: 'Auto-renews monthly',
    savings: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$2.99',
    period: '/yr',
    badge: 'Best Value',
    icon: Star,
    description: 'Auto-renews yearly',
    savings: 'Save 75%',
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$4.99',
    period: '',
    badge: 'Ultimate',
    icon: Gem,
    description: 'One-time purchase, forever',
    savings: 'Pay once',
  },
];

const FEATURES = [
  { icon: Zap, text: 'Price Hike Alerts' },
  { icon: Shield, text: '30-Day Future Outlook' },
  { icon: Sparkles, text: 'Calendar view with payment dots' },
  { icon: Check, text: 'Monthly budget goals & tracking' },
  { icon: Check, text: 'Spending predictions & forecasts' },
  { icon: Check, text: 'Advanced search & filters' },
  { icon: Check, text: 'Custom accent colors (6 themes)' },
  { icon: Check, text: 'Export payments as CSV' },
];

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, setPremium, checkSubscription } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle success redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowConfetti(true);
      setPremium(true);
      checkSubscription?.();
      toast.success('Welcome to Premium! 🎉');
      // Clean URL
      window.history.replaceState({}, '', '/premium');
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Payment canceled', { icon: '🔙' });
      window.history.replaceState({}, '', '/premium');
    }
  }, [searchParams]);

  const handlePurchase = async () => {
    haptic(25);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_id: selectedPlan },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <PageTransition>
        <div className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground mb-8"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pt-12"
          >
            <div className="w-20 h-20 rounded-[1.5rem] bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-9 h-9 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">You're Premium!</h1>
            <p className="text-sm text-muted-foreground/60">
              Enjoy all premium features unlocked
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('customer-portal');
                  if (error) throw error;
                  if (data?.url) window.open(data.url, '_blank');
                } catch {
                  toast.error('Could not open subscription manager');
                }
              }}
              className="mt-8 px-6 py-3 rounded-xl border border-border text-sm font-semibold text-foreground"
            >
              Manage Subscription
            </motion.button>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  const selected = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <PageTransition>
      {showConfetti && <Confetti trigger={showConfetti} />}
      <div className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-8"
        >
          <motion.div
            className="relative inline-flex items-center justify-center mb-5"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="w-16 h-16 rounded-2xl mono-card-solid flex items-center justify-center border border-border/20">
              <Crown className="w-7 h-7 text-primary" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-1.5">
            Go Premium
          </h1>
          <p className="text-[13px] text-muted-foreground/50 max-w-[260px] mx-auto">
            Unlock powerful insights & take full control
          </p>
        </motion.div>

        {/* Plan selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-2.5 mb-6"
        >
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const Icon = plan.icon;
            return (
              <motion.button
                key={plan.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  haptic(10);
                  setSelectedPlan(plan.id);
                }}
                className={`relative flex flex-col items-center p-3.5 rounded-2xl border-2 transition-all duration-150 ${
                  isSelected
                    ? 'border-primary bg-primary/8 shadow-lg shadow-primary/10'
                    : 'border-border/40 bg-card/50'
                }`}
              >
                {plan.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    plan.id === 'yearly'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground/10 text-foreground/70'
                  }`}>
                    {plan.badge}
                  </span>
                )}
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground/50'}`} />
                <span className={`text-[11px] font-semibold mb-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                  {plan.label}
                </span>
                <span className={`text-lg font-extrabold tracking-tight ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                  {plan.price}
                </span>
                <span className="text-[10px] text-muted-foreground/40">{plan.period || 'forever'}</span>
                {plan.savings && (
                  <span className="mt-1.5 text-[9px] font-bold text-primary/80">{plan.savings}</span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Auto-renewal notice for subscriptions */}
        <AnimatePresence mode="wait">
          {selectedPlan !== 'lifetime' && (
            <motion.p
              key="renewal-notice"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center text-[11px] text-muted-foreground/40 mb-5 leading-relaxed"
            >
              Auto-renews {selectedPlan === 'monthly' ? 'every month' : 'every year'}. Cancel anytime from your subscription manager.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl mono-card p-4 mb-8"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-muted-foreground/40 mb-3">
            Everything included
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.03 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[13px] text-foreground/90">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            onClick={handlePurchase}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] shadow-xl shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Get {selected.label} — {selected.price}{selected.period}
              </>
            )}
          </motion.button>

          <p className="text-center text-[11px] text-muted-foreground/30">
            Secure payment via Stripe · {selectedPlan === 'lifetime' ? 'One-time charge' : 'Cancel anytime'}
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
