import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/useUser';
import { useCurrency, CURRENCIES } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import { Search, Trash2, CalendarDays } from 'lucide-react';

export default function Settings() {
  const { userId, logout, restore } = useUser();
  const { currency, setCurrency } = useCurrency();
  const [phone, setPhone] = useState('');
  const [reminderDays, setReminderDays] = useState(3);
  const [paidClearDay, setPaidClearDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Load user settings
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('users').select('default_reminder_days, paid_clear_day').eq('id', userId).single();
      if (data) {
        setReminderDays(data.default_reminder_days);
        setPaidClearDay(data.paid_clear_day ?? 1);
      }
    })();
  }, [userId]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await restore(digits);
      toast.success('Data restored! Reload to see payments.');
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || 'No account found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReminder = async (days: number) => {
    setReminderDays(days);
    if (userId) {
      await supabase.from('users').update({ default_reminder_days: days }).eq('id', userId);
      toast.success(`Default reminder set to ${days} days`);
    }
  };

  const handleUpdateClearDay = async (day: string) => {
    const dayNum = parseInt(day);
    setPaidClearDay(dayNum);
    if (userId) {
      await supabase.from('users').update({ paid_clear_day: dayNum } as any).eq('id', userId);
      toast.success(`Paid list clears on day ${dayNum} of each month`);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground mb-8"
        >
          Settings
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Restore data */}
          <section className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold text-card-foreground mb-3">Restore / Change Device</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your phone number to restore your payment data on this device.
            </p>
            <form onSubmit={handleRestore} className="space-y-3">
              <Input
                type="tel"
                placeholder="10-digit phone"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                maxLength={11}
              />
              <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
                {loading ? 'Restoring...' : 'Restore Data'}
              </Button>
            </form>
          </section>

          {/* Currency selector */}
          <section className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold text-card-foreground mb-3">Currency</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Current: <span className="text-foreground font-medium">{currency.symbol} — {currency.name} ({currency.code})</span>
            </p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search currencies..."
                value={currencySearch}
                onChange={e => setCurrencySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg">
              {CURRENCIES
                .filter(c =>
                  !currencySearch ||
                  c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.symbol.includes(currencySearch)
                )
                .map(c => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c);
                      toast.success(`Currency set to ${c.symbol} ${c.code}`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                      currency.code === c.code
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-secondary text-card-foreground'
                    }`}
                  >
                    <span>
                      <span className="font-medium mr-2">{c.symbol}</span>
                      {c.name}
                    </span>
                    <span className="text-muted-foreground text-xs">{c.code}</span>
                  </button>
                ))}
            </div>
          </section>

          {/* Default reminder */}
          <section className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold text-card-foreground mb-3">Default Reminder</h2>
            <div className="space-y-3">
              <Label>Remind me {reminderDays} days before due date</Label>
              <Slider
                value={[reminderDays]}
                onValueChange={([v]) => handleUpdateReminder(v)}
                min={1}
                max={14}
                step={1}
              />
            </div>
          </section>

          {/* Paid list clear day */}
          <section className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-status-warning/15 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-status-warning" />
              </div>
              <div>
                <h2 className="font-semibold text-card-foreground">Clear Paid List</h2>
                <p className="text-xs text-muted-foreground">Auto-clear paid payments monthly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Label className="text-sm text-muted-foreground flex-shrink-0">Clear on day</Label>
              <Select value={String(paidClearDay)} onValueChange={handleUpdateClearDay}>
                <SelectTrigger className="w-24 h-10 bg-secondary/50 border-0 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[200] max-h-60">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <SelectItem key={d} value={String(d)}>
                      {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">of month</span>
            </div>
          </section>

          {/* Logout */}
          <section className="bg-card rounded-lg p-4 border border-border">
            <h2 className="font-semibold text-card-foreground mb-3">Account</h2>
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              Sign Out & Clear Data
            </Button>
          </section>

          <p className="text-xs text-muted-foreground text-center">
            PayTrack v1.0 · Your data is synced securely
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
