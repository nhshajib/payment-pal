import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser'; // force resolve
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Onboarding() {
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

    setLoading(true);
    try {
      if (mode === 'restore') {
        await restore(digits);
        toast.success('Data restored successfully!');
      } else {
        await register(digits);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-bold text-foreground tracking-tight"
        >
          Pay<span className="text-primary">Track</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-muted-foreground mt-2"
        >
          Never miss a payment again
        </motion.p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-4"
      >
        <Input
          type="tel"
          placeholder="Enter 10-digit phone"
          value={phone}
          onChange={e => setPhone(formatPhone(e.target.value))}
          className="text-center text-lg tracking-widest h-12"
          maxLength={11}
        />

        <motion.div whileTap={{ scale: 0.97 }}>
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'restore' ? 'Restore Data' : 'Get Started'}
          </Button>
        </motion.div>

        <button
          type="button"
          onClick={() => setMode(m => m === 'new' ? 'restore' : 'new')}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          {mode === 'new' ? 'Already have an account? Restore data' : 'New here? Create account'}
        </button>
      </motion.form>
    </div>
  );
}
