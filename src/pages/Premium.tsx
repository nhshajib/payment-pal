import { motion } from 'framer-motion';
import { Crown, Check, ChevronLeft, Sparkles, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '@/hooks/usePremium';
import PageTransition from '@/components/PageTransition';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';

const FEATURES = [
  { icon: Zap, text: 'Price Hike Alerts — catch subscription creep' },
  { icon: Shield, text: '30-Day Future Outlook — plan ahead' },
  { icon: Sparkles, text: 'Calendar view with payment dots' },
  { icon: Check, text: 'Monthly budget goals & tracking' },
  { icon: Check, text: 'Spending predictions & forecasts' },
  { icon: Check, text: 'Advanced search & filters' },
  { icon: Check, text: 'Custom accent colors (6 themes)' },
  { icon: Check, text: 'Export payments as CSV' },
];

export default function Premium() {
  const navigate = useNavigate();
  const { setPremium } = usePremium();

  return (
    <PageTransition>
      <div className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <motion.div
            className="relative inline-flex items-center justify-center mb-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 18 }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="w-20 h-20 rounded-[1.5rem] mono-card-solid flex items-center justify-center border border-border/30">
              <Crown className="w-9 h-9 text-primary" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
            Upgrade to Premium
          </h1>
          <p className="text-sm text-muted-foreground/60 max-w-[280px] mx-auto">
            Unlock powerful insights and take full control of your finances
          </p>
        </motion.div>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl mono-card p-5 mb-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-muted-foreground/50 mb-4">
            Everything included
          </p>
          <div className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg mono-card-solid flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm text-foreground">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Price & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="mb-5">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">$0.99</span>
            <span className="text-sm text-muted-foreground/50 ml-1.5">one-time</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              haptic(25);
              navigate('/settings');
              toast('Open Settings → Premium to purchase', { icon: '👑' });
            }}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Get Premium
          </motion.button>

          <p className="text-[11px] text-muted-foreground/40 mt-3">
            Secure payment via PayPal · One-time charge
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
