import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Receipt, Wallet, Repeat, ArrowRight, UserPlus, LogIn, ChevronLeft, Sparkles } from 'lucide-react';

const floatingIcons = [
  { Icon: CreditCard, x: '10%', y: '15%', delay: 0, rotate: -15, size: 'w-10 h-10' },
  { Icon: Receipt, x: '80%', y: '10%', delay: 0.15, rotate: 12, size: 'w-8 h-8' },
  { Icon: Wallet, x: '18%', y: '35%', delay: 0.3, rotate: -8, size: 'w-7 h-7' },
  { Icon: Repeat, x: '75%', y: '30%', delay: 0.45, rotate: 20, size: 'w-9 h-9' },
  { Icon: Sparkles, x: '50%', y: '8%', delay: 0.6, rotate: 0, size: 'w-6 h-6' },
  { Icon: CreditCard, x: '85%', y: '40%', delay: 0.75, rotate: -25, size: 'w-6 h-6' },
];

type Screen = 'landing' | 'login' | 'signup';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, restore } = useUser();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('landing');

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await restore(digits);
      toast.success('Welcome back!');
      navigate('/schedule');
    } catch (err: any) {
      toast.error(err?.message || 'No account found with that number');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      await register(digits, name.trim());
      toast.success('Welcome to PayTrack!');
      navigate('/schedule');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPhone('');
    setName('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background gradient mesh - Netflix style deep red/dark */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(358, 94%, 47%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, hsl(280, 70%, 55%, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, hsl(358, 80%, 40%, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Animated grain overlay for cinematic feel */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, rotate, size }, i) => (
        <motion.div
          key={i}
          className="absolute text-muted-foreground/10"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate,
            y: [0, -10, 0],
          }}
          transition={{
            delay: delay + 0.3,
            duration: 0.6,
            y: { delay: delay + 1, duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <Icon className={size} />
        </motion.div>
      ))}

      <AnimatePresence mode="wait">
        {/* ─── Landing Screen ─── */}
        {screen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-xs flex flex-col items-center"
          >
            {/* Logo entrance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center mb-4"
            >
              {/* Glow ring behind logo */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-40 h-40 rounded-full"
                style={{ background: 'radial-gradient(circle, hsl(358, 94%, 47%, 0.2) 0%, transparent 70%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
              />
              <h1 className="text-6xl font-extrabold tracking-tight relative">
                <span className="text-foreground">Pay</span>
                <span className="text-primary">Track</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-muted-foreground text-sm tracking-wide mb-14 text-center"
            >
              Never miss a payment again
            </motion.p>

            {/* Sign In form directly on landing */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              onSubmit={handleLogin}
              className="w-full space-y-3"
            >
              <div className="glass rounded-2xl p-5 border border-border/50 space-y-3">
                <Input
                  type="tel"
                  placeholder="Enter 10-digit phone"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  className="text-center text-lg tracking-widest bg-secondary/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary h-14"
                  maxLength={11}
                />

                <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <Button
                    type="submit"
                    className="w-full h-14 text-base font-bold rounded-xl shadow-xl shadow-primary/30 gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Secondary CTA - New User */}
              <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { resetForm(); setScreen('signup'); }}
                  className="w-full h-14 text-base font-semibold rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  New User? Get Started
                </Button>
              </motion.div>
            </motion.form>

            {/* Bottom tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="text-muted-foreground/40 text-xs mt-8 text-center"
            >
              Your data syncs with your phone number
            </motion.p>
          </motion.div>
        )}


        {/* ─── Signup Screen ─── */}
        {screen === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-xs"
          >
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setScreen('landing')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Create account</h2>
              <p className="text-muted-foreground text-sm mt-1">Set up your profile to start tracking payments</p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSignup}
              className="space-y-4"
            >
              <div className="glass rounded-2xl p-5 border border-border/50 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block">Your Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="text-center text-lg bg-secondary/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary h-14"
                    maxLength={50}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    className="text-center text-lg tracking-widest bg-secondary/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary h-14"
                    maxLength={11}
                  />
                </div>

                <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                  <Button
                    type="submit"
                    className="w-full h-13 text-base font-bold rounded-xl shadow-lg shadow-primary/25 gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground/40 text-xs text-center"
              >
                Your phone number is used to sync data across devices
              </motion.p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
