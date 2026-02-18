import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CreditCard, Receipt, Wallet, Repeat } from 'lucide-react';

const floatingIcons = [
  { Icon: CreditCard, x: '15%', y: '18%', delay: 0, rotate: -15 },
  { Icon: Receipt, x: '75%', y: '12%', delay: 0.2, rotate: 12 },
  { Icon: Wallet, x: '25%', y: '32%', delay: 0.4, rotate: -8 },
  { Icon: Repeat, x: '70%', y: '28%', delay: 0.6, rotate: 20 },
];

export default function Onboarding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, restore } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'new' | 'restore'>('new');

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (mode === 'new' && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'restore') {
        await restore(digits);
        toast.success('Data restored successfully!');
      } else {
        await register(digits, name.trim());
        toast.success('Welcome to PayTrack!');
      }
      navigate('/schedule');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background gradient mesh */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, hsl(358, 94%, 47%, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsl(280, 70%, 55%, 0.06) 0%, transparent 50%)',
        }}
      />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, rotate }, i) => (
        <motion.div
          key={i}
          className="absolute text-muted-foreground/15"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate,
            y: [0, -8, 0],
          }}
          transition={{
            delay: delay + 0.5,
            duration: 0.5,
            y: { delay: delay + 1, duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <Icon className="w-8 h-8" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-10 relative z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-extrabold text-foreground tracking-tight"
        >
          Pay<span className="text-primary">Track</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-muted-foreground mt-2 tracking-wide"
        >
          Never miss a payment again
        </motion.p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-4 relative z-10"
      >
        {/* Glass card around inputs */}
        <div className="glass rounded-2xl p-5 border border-border/50 space-y-3">
          {mode === 'new' && (
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-center text-lg h-12 bg-secondary/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
              maxLength={50}
            />
          )}

          <Input
            type="tel"
            placeholder="Enter 10-digit phone"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            className="text-center text-lg tracking-widest bg-secondary/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
            style={{ height: '52px' }}
            maxLength={11}
          />

          <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'restore' ? 'Restore Data' : 'Get Started'}
            </Button>
          </motion.div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode(m => m === 'new' ? 'restore' : 'new')}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
        >
          {mode === 'new' ? 'Already have an account? Restore data' : 'New here? Create account'}
        </motion.button>
      </motion.form>
    </div>
  );
}
