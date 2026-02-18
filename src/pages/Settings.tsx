import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/useUser';
import { useCurrency, CURRENCIES } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import {
  Search, Trash2, CalendarDays, Bell, Coins, RefreshCw, LogOut,
  ChevronRight, X, Check, Smartphone, BellRing, AlertTriangle,
  Clock, CalendarCheck, Send, User, Sun, Moon, Monitor,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs,
  requestNotificationPermission, getNotificationStatus, sendTestNotification,
} from '@/lib/notifications';

/* ─── Settings Modal ─── */
function SettingsModal({
  open,
  onClose,
  title,
  children,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed inset-x-4 top-[15%] z-[70] max-w-md mx-auto"
          >
            <div className="bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <h2 className="text-lg font-bold text-card-foreground">{title}</h2>
                <motion.button
                  whileTap={{ scale: 0.85, rotate: -90 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="px-5 py-5 max-h-[55vh] overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {onSave && (
                <div className="flex gap-3 px-5 py-4 border-t border-border/50">
                  <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                    <Button variant="secondary" onClick={onClose} className="w-full rounded-xl h-11">
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                    <Button
                      onClick={onSave}
                      disabled={saveDisabled}
                      className="w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      {saveLabel}
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Settings Card ─── */
function SettingsCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onClick,
  destructive,
  index,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  destructive?: boolean;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, type: 'spring', stiffness: 350, damping: 28 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4 text-left active:bg-secondary/50 transition-all group"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-shadow group-active:shadow-lg"
        style={{ backgroundColor: iconBg, boxShadow: `0 0 0px ${iconColor}00` }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${destructive ? 'text-destructive' : 'text-card-foreground'}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 transition-transform group-active:translate-x-0.5" />
    </motion.button>
  );
}

/* ─── Main Settings Page ─── */
export default function Settings() {
  const { userId, userName, updateName, logout, restore } = useUser();
  const { currency, setCurrency } = useCurrency();
  const { mode, theme, setMode } = useTheme();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [tempName, setTempName] = useState(userName);

  const [phone, setPhone] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [reminderDays, setReminderDays] = useState(3);
  const [tempReminder, setTempReminder] = useState(3);

  const [paidClearDay, setPaidClearDay] = useState(1);
  const [tempClearDay, setTempClearDay] = useState(1);

  const [currencySearch, setCurrencySearch] = useState('');
  const [tempCurrency, setTempCurrency] = useState(currency);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(getNotificationPrefs());
  const [tempNotifPrefs, setTempNotifPrefs] = useState<NotificationPrefs>(notifPrefs);
  const [notifStatus, setNotifStatus] = useState(getNotificationStatus());

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('users').select('default_reminder_days, paid_clear_day').eq('id', userId).single();
      if (data) {
        setReminderDays(data.default_reminder_days);
        setTempReminder(data.default_reminder_days);
        setPaidClearDay(data.paid_clear_day ?? 1);
        setTempClearDay(data.paid_clear_day ?? 1);
      }
    })();
  }, [userId]);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const close = () => {
    setActiveModal(null);
    setCurrencySearch('');
  };

  const handleRestore = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setRestoreLoading(true);
    try {
      await restore(digits);
      toast.success('Data restored successfully!');
      close();
      setTimeout(() => window.location.reload(), 800);
    } catch (err: any) {
      toast.error(err?.message || 'No account found');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleSaveReminder = async () => {
    setReminderDays(tempReminder);
    if (userId) {
      await supabase.from('users').update({ default_reminder_days: tempReminder }).eq('id', userId);
    }
    toast.success(`Reminder set to ${tempReminder} days before due`);
    close();
  };

  const handleSaveClearDay = async () => {
    setPaidClearDay(tempClearDay);
    if (userId) {
      await supabase.from('users').update({ paid_clear_day: tempClearDay } as any).eq('id', userId);
    }
    toast.success(`Paid list will clear on day ${tempClearDay}`);
    close();
  };

  const handleSaveCurrency = () => {
    setCurrency(tempCurrency);
    toast.success(`Currency changed to ${tempCurrency.symbol} ${tempCurrency.code}`);
    close();
  };

  const handleLogout = () => {
    setActiveModal(null);
    setSigningOut(true);
    setTimeout(() => {
      logout();
    }, 600);
  };

  const ordinal = (n: number) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

  return (
    <PageTransition>
      {/* Sign-out overlay */}
      <AnimatePresence>
        {signingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <LogOut className="w-7 h-7 text-primary" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-muted-foreground text-sm font-medium"
            >
              Signing out…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">Customize your experience</p>
        </motion.header>

        <div className="space-y-2.5">
          <SettingsCard
            index={0}
            icon={<User className="w-5 h-5" />}
            iconBg="hsl(358 94% 47% / 0.15)"
            iconColor="hsl(358, 94%, 47%)"
            title="Name"
            subtitle={userName || 'Set your name'}
            onClick={() => { setTempName(userName); setActiveModal('name'); }}
          />
          <SettingsCard
            index={1}
            icon={<Coins className="w-5 h-5" />}
            iconBg="hsl(38 92% 50% / 0.15)"
            iconColor="hsl(38, 92%, 50%)"
            title="Currency"
            subtitle={`${currency.symbol} — ${currency.name}`}
            onClick={() => { setTempCurrency(currency); setActiveModal('currency'); }}
          />
          <SettingsCard
            index={2}
            icon={<Bell className="w-5 h-5" />}
            iconBg="hsl(200 80% 55% / 0.15)"
            iconColor="hsl(200, 80%, 55%)"
            title="Default Reminder"
            subtitle={`${reminderDays} days before due date`}
            onClick={() => { setTempReminder(reminderDays); setActiveModal('reminder'); }}
          />
          <SettingsCard
            index={3}
            icon={<Trash2 className="w-5 h-5" />}
            iconBg="hsl(38 92% 50% / 0.15)"
            iconColor="hsl(38, 92%, 50%)"
            title="Clear Paid List"
            subtitle={`Clears on the ${ordinal(paidClearDay)} of each month`}
            onClick={() => { setTempClearDay(paidClearDay); setActiveModal('clearday'); }}
          />
          <SettingsCard
            index={4}
            icon={<BellRing className="w-5 h-5" />}
            iconBg="hsl(280 70% 55% / 0.15)"
            iconColor="hsl(280, 70%, 55%)"
            title="Notifications"
            subtitle={notifPrefs.enabled && notifStatus === 'granted' ? 'Enabled' : notifStatus === 'denied' ? 'Blocked by browser' : 'Disabled'}
            onClick={async () => {
              // If not yet asked, trigger browser permission popup first
              if (notifStatus === 'default') {
                const granted = await requestNotificationPermission();
                setNotifStatus(getNotificationStatus());
                if (granted) {
                  toast.success('Notifications enabled!');
                  // Auto-enable prefs
                  const newPrefs = { ...notifPrefs, enabled: true };
                  saveNotificationPrefs(newPrefs);
                  setNotifPrefs(newPrefs);
                  setTempNotifPrefs(newPrefs);
                }
              }
              setTempNotifPrefs(notifPrefs);
              setActiveModal('notifications');
            }}
          />
          <SettingsCard
            index={4}
            icon={<Smartphone className="w-5 h-5" />}
            iconBg="hsl(152 69% 40% / 0.15)"
            iconColor="hsl(152, 69%, 40%)"
            title="Restore / Change Device"
            subtitle="Transfer data to a new device"
            onClick={() => { setPhone(''); setActiveModal('restore'); }}
          />
          {/* Theme Selector */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 350, damping: 28 }}
            className="w-full bg-card rounded-xl border border-border/50 p-4 space-y-3"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: 'hsl(45 93% 55% / 0.15)' }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5" style={{ color: 'hsl(45, 93%, 55%)' }} />
                    ) : (
                      <Sun className="w-5 h-5" style={{ color: 'hsl(45, 93%, 55%)' }} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-card-foreground">Appearance</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mode === 'auto' ? 'System default' : mode === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
            </div>
            <div className="flex bg-secondary/60 rounded-xl p-1 gap-1">
              {([
                { id: 'light' as const, label: 'Light', icon: Sun },
                { id: 'auto' as const, label: 'Auto', icon: Monitor },
                { id: 'dark' as const, label: 'Dark', icon: Moon },
              ]).map(opt => {
                const Icon = opt.icon;
                const active = mode === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode(opt.id)}
                    className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active ? 'text-card-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="theme-indicator"
                        className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/50"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <SettingsCard
            index={6}
            icon={<LogOut className="w-5 h-5" />}
            iconBg="hsl(0 84% 60% / 0.15)"
            iconColor="hsl(0, 84%, 60%)"
            title="Sign Out"
            subtitle="Clear local data and sign out"
            onClick={() => setActiveModal('logout')}
            destructive
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground text-center mt-8"
        >
          PayTrack v1.0 · Your data is synced securely
        </motion.p>

        {/* ─── Name Modal ─── */}
        <SettingsModal
          open={activeModal === 'name'}
          onClose={close}
          title="Your Name"
          onSave={async () => {
            await updateName(tempName.trim());
            toast.success('Name updated');
            close();
          }}
          saveDisabled={!tempName.trim()}
        >
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                This name will be used in your greeting.
              </p>
            </div>
            <Input
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              className="h-12 bg-secondary/50 border-0 rounded-xl text-center text-lg font-medium"
            />
          </div>
        </SettingsModal>

        {/* ─── Currency Modal ─── */}
        <SettingsModal open={activeModal === 'currency'} onClose={close} title="Currency" onSave={handleSaveCurrency}>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search currencies..."
                value={currencySearch}
                onChange={e => setCurrencySearch(e.target.value)}
                className="pl-9 h-11 bg-secondary/50 border-0 rounded-xl"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg">
              {CURRENCIES
                .filter(c =>
                  !currencySearch ||
                  c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.symbol.includes(currencySearch)
                )
                .map(c => (
                  <motion.button
                    key={c.code}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setTempCurrency(c)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all ${
                      tempCurrency.code === c.code
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'hover:bg-secondary text-card-foreground'
                    }`}
                  >
                    <span>
                      <span className="font-semibold mr-2">{c.symbol}</span>
                      {c.name}
                    </span>
                    <span className="text-muted-foreground text-xs">{c.code}</span>
                  </motion.button>
                ))}
            </div>
          </div>
        </SettingsModal>

        {/* ─── Reminder Modal ─── */}
        <SettingsModal open={activeModal === 'reminder'} onClose={close} title="Default Reminder" onSave={handleSaveReminder}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{tempReminder}</p>
              <p className="text-muted-foreground text-sm mt-1">days before due date</p>
            </div>
            <Slider
              value={[tempReminder]}
              onValueChange={([v]) => setTempReminder(v)}
              min={1}
              max={14}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>14 days</span>
            </div>
          </div>
        </SettingsModal>

        {/* ─── Clear Day Modal ─── */}
        <SettingsModal open={activeModal === 'clearday'} onClose={close} title="Clear Paid List" onSave={handleSaveClearDay}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-status-warning/10 mb-4">
                <CalendarDays className="w-8 h-8 text-status-warning" />
              </div>
              <p className="text-sm text-muted-foreground">
                Paid payments will be automatically cleared on this day each month.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Label className="text-sm text-muted-foreground">Clear on</Label>
              <Select value={String(tempClearDay)} onValueChange={v => setTempClearDay(parseInt(v))}>
                <SelectTrigger className="w-28 h-11 bg-secondary/50 border-0 rounded-xl text-center font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[200] max-h-60">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <SelectItem key={d} value={String(d)}>
                      {ordinal(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-sm text-muted-foreground">of month</Label>
            </div>
          </div>
        </SettingsModal>

        {/* ─── Notifications Modal ─── */}
        <SettingsModal
          open={activeModal === 'notifications'}
          onClose={close}
          title="Notifications"
          onSave={() => {
            saveNotificationPrefs(tempNotifPrefs);
            setNotifPrefs(tempNotifPrefs);
            toast.success('Notification preferences saved');
            close();
          }}
        >
          <div className="space-y-5">
            {notifStatus === 'denied' ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 mb-4">
                  <BellRing className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Notifications are blocked. Please enable them in your browser settings, then tap below.
                </p>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => {
                    // Re-check status (user may have changed browser settings)
                    setNotifStatus(getNotificationStatus());
                    if (getNotificationStatus() === 'granted') {
                      toast.success('Notifications are now enabled!');
                    } else {
                      toast.error('Still blocked — check browser settings');
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Permission Status
                </Button>
              </div>
            ) : notifStatus === 'default' ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
                  <BellRing className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Allow notifications to receive payment reminders.
                </p>
                <Button
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    setNotifStatus(getNotificationStatus());
                    if (granted) {
                      toast.success('Notifications enabled!');
                      const newPrefs = { ...tempNotifPrefs, enabled: true };
                      setTempNotifPrefs(newPrefs);
                      saveNotificationPrefs(newPrefs);
                      setNotifPrefs(newPrefs);
                    } else {
                      toast.error('Permission denied');
                    }
                  }}
                  className="rounded-xl"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Allow Notifications
                </Button>
              </div>
            ) : (
              <>
                {/* Master toggle */}
                <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">All Notifications</p>
                      <p className="text-xs text-muted-foreground">Master toggle</p>
                    </div>
                  </div>
                  <Switch
                    checked={tempNotifPrefs.enabled}
                    onCheckedChange={(v) => setTempNotifPrefs(prev => ({ ...prev, enabled: v }))}
                  />
                </div>

                {/* Individual toggles */}
                <div className={`space-y-1 transition-opacity ${tempNotifPrefs.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                  {[
                    { key: 'overdue' as const, icon: AlertTriangle, label: 'Overdue Payments', desc: 'When a payment is past due', color: 'hsl(0, 84%, 60%)' },
                    { key: 'dueToday' as const, icon: Clock, label: 'Due Today', desc: 'Payments due on the current day', color: 'hsl(38, 92%, 50%)' },
                    { key: 'upcoming' as const, icon: CalendarCheck, label: 'Upcoming Reminders', desc: 'Before the due date', color: 'hsl(200, 80%, 55%)' },
                    { key: 'paid' as const, icon: Check, label: 'Payment Confirmed', desc: 'When you mark a payment as paid', color: 'hsl(152, 69%, 40%)' },
                  ].map(({ key, icon: Icon, label, desc, color }) => (
                    <div key={key} className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={tempNotifPrefs[key]}
                        onCheckedChange={(v) => setTempNotifPrefs(prev => ({ ...prev, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                {/* Test button (dev) */}
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl h-11"
                    onClick={() => {
                      sendTestNotification();
                      toast.success('Test notification sent!');
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    🧪 Test Notification
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </SettingsModal>

        {/* ─── Restore Modal ─── */}
        <SettingsModal
          open={activeModal === 'restore'}
          onClose={close}
          title="Restore Data"
          onSave={handleRestore}
          saveLabel={restoreLoading ? 'Restoring...' : 'Restore'}
          saveDisabled={restoreLoading}
        >
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-status-success/10 mb-4">
                <RefreshCw className="w-8 h-8 text-status-success" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter the phone number you used during onboarding to restore your payment data.
              </p>
            </div>
            <Input
              type="tel"
              placeholder="10-digit phone number"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              maxLength={11}
              className="h-12 bg-secondary/50 border-0 rounded-xl text-center text-lg font-medium tracking-wider"
            />
          </div>
        </SettingsModal>

        {/* ─── Logout Modal ─── */}
        <SettingsModal open={activeModal === 'logout'} onClose={close} title="Sign Out">
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 mb-4">
                <LogOut className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                This will clear all local data. You can restore it later using your phone number.
              </p>
            </div>
            <div className="flex gap-3">
              <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                <Button variant="secondary" onClick={close} className="w-full rounded-xl h-11">
                  Cancel
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                <Button variant="destructive" onClick={handleLogout} className="w-full rounded-xl h-11">
                  Sign Out
                </Button>
              </motion.div>
            </div>
          </div>
        </SettingsModal>
      </div>
    </PageTransition>
  );
}
