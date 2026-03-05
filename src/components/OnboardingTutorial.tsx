import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Bell, CreditCard, Crown, ChevronRight, Sparkles, Clock, Users } from 'lucide-react';

const TUTORIAL_KEY = 'paytrack_tutorial_done';

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: <CalendarCheck className="w-10 h-10" />,
    title: 'Track Every Payment',
    description: 'Add bills, subscriptions, and one-time payments. Swipe right to mark paid, left to delete.',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: <Bell className="w-10 h-10" />,
    title: 'Never Miss a Due Date',
    description: 'Get smart reminders before bills are due — even when the app is closed.',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: <CreditCard className="w-10 h-10" />,
    title: 'Swipe to Take Action',
    description: 'Swipe right on any bill to mark it paid. Long-press for more options like edit or delete.',
    gradient: 'from-sky-500/20 to-sky-500/5',
  },
  {
    icon: <Crown className="w-10 h-10" />,
    title: 'Unlock Premium',
    description: 'Get spending predictions, calendar view, budget goals, roommate splitting & more for just $0.99.',
    gradient: 'from-yellow-500/20 to-yellow-500/5',
  },
];

export function shouldShowTutorial(): boolean {
  return !localStorage.getItem(TUTORIAL_KEY);
}

export function markTutorialDone() {
  localStorage.setItem(TUTORIAL_KEY, 'true');
}

export default function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      markTutorialDone();
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    markTutorialDone();
    onComplete();
  };

  const current = STEPS[step];

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-full max-w-md mx-4 mb-8 rounded-3xl bg-card border border-border overflow-hidden shadow-2xl"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5 pb-2">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full"
              animate={{
                width: i === step ? 24 : 8,
                backgroundColor: i <= step
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--muted-foreground) / 0.25)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="px-8 pt-6 pb-4 flex flex-col items-center text-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Icon */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center mb-5`}>
              <span className="text-foreground">{current.icon}</span>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
              {current.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="px-8 pb-6 pt-2 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Skip
          </button>

          <motion.button
            onClick={handleNext}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-full"
          >
            {isLast ? (
              <>
                <Sparkles className="w-4 h-4" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
