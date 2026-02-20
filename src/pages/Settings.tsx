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
  Clock, CalendarCheck, Send, User, Sun, Moon, Monitor, Download, Share,
  MessageSquare, Star,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs,
  requestNotificationPermission, getNotificationStatus, sendTestNotification,
} from '@/lib/notifications';

/* ─── iOS-style bottom sheet modal ─── */
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
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div
              className="rounded-t-[22px] overflow-hidden shadow-2xl"
              style={{
                background: 'hsl(240 3% 13% / 0.97)',
                backdropFilter: 'blur(40px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-[4px] rounded-full bg-white/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
                <h2
                  className="text-[17px] font-bold text-white tracking-[-0.3px]"
                >
                  {title}
                </h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <X className="w-4 h-4 text-white/70" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="px-5 py-5 max-h-[55vh] overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {onSave && (
                <div className="flex gap-3 px-5 py-4 border-t border-white/[0.07] pb-safe">
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex-1"
                  >
                    <Button
                      variant="secondary"
                      onClick={onClose}
                      className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={onSave}
                      disabled={saveDisabled}
                      className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold"
                      style={{
                        background: '#e50914',
                        boxShadow: '0 4px 14px rgba(229,9,20,0.35)',
                        color: '#fff',
                        opacity: saveDisabled ? 0.5 : 1,
                      }}
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

/* ─── iOS Section container ─── */
function IOSSection({
  label,
  children,
  danger = false,
  index = 0,
}: {
  label: string;
  children: ReactNode;
  danger?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      className="mb-6"
    >
      {/* Section label */}
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.8px] mb-2 ml-1"
        style={{ color: '#6b7280' }}
      >
        {label}
      </p>

      {/* Section card */}
      <div
        className="rounded-[16px] overflow-hidden"
        style={{
          background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: danger
            ? '1px solid rgba(239,68,68,0.15)'
            : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

/* ─── iOS Row ─── */
function IOSRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onClick,
  rightElement,
  destructive = false,
  isLast = false,
}: {
  icon: ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
  rightElement?: ReactNode;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4" style={{ minHeight: '54px' }}>
      {/* Icon badge — 28×28 circular gradient */}
      <div
        className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${iconColor}ee 0%, ${iconColor}99 100%)`,
          boxShadow: `0 2px 6px ${iconColor}33`,
        }}
      >
        <span style={{ color: '#fff', display: 'flex' }}>{icon}</span>
      </div>

      {/* Text block */}
      <div className="flex-1 flex items-center justify-between min-w-0 py-[13px]">
        <div className="min-w-0 flex-1">
          <p
            className="text-[16px] font-semibold leading-tight tracking-[-0.3px]"
            style={{ color: destructive ? '#ef4444' : '#fff' }}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-[13px] mt-0.5 truncate" style={{ color: '#9ca3af' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {value && (
            <span className="text-[15px] tracking-[-0.2px]" style={{ color: '#9ca3af' }}>
              {value}
            </span>
          )}
          {rightElement}
          {onClick && !rightElement && (
            <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {onClick ? (
        <motion.button
          whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.8 }}
          onClick={onClick}
          className="w-full text-left"
        >
          {content}
        </motion.button>
      ) : (
        <div>{content}</div>
      )}

      {/* Inset divider (starts after icon) */}
      {!isLast && (
        <div className="ml-[52px] mr-0 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      )}
    </>
  );
}

/* ─── Appearance segmented control row ─── */
function IOSAppearanceRow({
  mode,
  theme,
  setMode,
}: {
  mode: 'light' | 'auto' | 'dark';
  theme: 'light' | 'dark';
  setMode: (m: 'light' | 'auto' | 'dark') => void;
}) {
  const opts = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'auto' as const, label: 'Auto', icon: Monitor },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f59e0bee 0%, #f59e0b99 100%)',
            boxShadow: '0 2px 6px #f59e0b33',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              initial={{ rotate: -45, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 45, opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ display: 'flex', color: '#fff' }}
            >
              {theme === 'dark'
                ? <Moon className="w-[14px] h-[14px]" />
                : <Sun className="w-[14px] h-[14px]" />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div>
          <p className="text-[16px] font-semibold tracking-[-0.3px] text-white">Appearance</p>
          <p className="text-[13px]" style={{ color: '#9ca3af' }}>
            {mode === 'auto' ? 'System default' : mode === 'dark' ? 'Dark mode' : 'Light mode'}
          </p>
        </div>
      </div>

      {/* Segmented pill */}
      <div
        className="flex p-1 rounded-[10px]"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {opts.map(opt => {
          const Icon = opt.icon;
          const active = mode === opt.id;
          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setMode(opt.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-[8px] text-[13px] font-semibold z-10 transition-colors"
              style={{ color: active ? '#0f0f0f' : '#9ca3af' }}
            >
              {active && (
                <motion.div
                  layoutId="appearance-thumb"
                  className="absolute inset-0 rounded-[8px]"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.35), 0 0.5px 0 rgba(255,255,255,0.4) inset',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.8 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Settings Page ─── */
export default function Settings() {
  const { userId, userName, updateName, logout, restore } = useUser();
  const { currency, setCurrency } = useCurrency();
  const { mode, theme, setMode } = useTheme();
  const { canInstall, isIOS, hasNativePrompt, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

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
      sessionStorage.setItem('paytrack_signed_out', '1');
      logout();
    }, 1800);
  };

  const ordinal = (n: number) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

  const notifSubtitle = notifStatus === 'denied'
    ? 'Blocked by browser'
    : notifStatus === 'granted'
    ? (notifPrefs.enabled ? 'Enabled' : 'Off')
    : 'Not set up';

  return (
    <PageTransition>
      {/* ─── Sign-out overlay — cinematic fullscreen transition ─── */}
      <AnimatePresence>
        {signingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div
              className="absolute w-64 h-64 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }}
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ delay: 0.6, duration: 0.5, ease: 'easeInOut' }}
              >
                <LogOut className="w-8 h-8" style={{ color: '#ef4444' }} />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-foreground text-base font-semibold mt-5 tracking-tight"
            >
              See you soon!
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-muted-foreground text-sm mt-1"
            >
              Signing out securely…
            </motion.p>
            <motion.div
              className="mt-8 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(239,68,68,0.2)' }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#ef4444' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto">
        {/* ─── Large Title Header ─── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <h1
            className="font-bold text-foreground"
            style={{ fontSize: '34px', letterSpacing: '-0.5px', lineHeight: 1.1 }}
          >
            Settings
          </h1>
        </motion.header>

        {/* ─── ACCOUNT ─── */}
        <IOSSection label="ACCOUNT" index={0}>
          <IOSRow
            icon={<User className="w-[14px] h-[14px]" />}
            iconColor="#3b82f6"
            title="Name"
            value={userName || 'Not set'}
            onClick={() => { setTempName(userName); setActiveModal('name'); }}
            isLast
          />
        </IOSSection>

        {/* ─── PREFERENCES ─── */}
        <IOSSection label="PREFERENCES" index={1}>
          <IOSRow
            icon={<Coins className="w-[14px] h-[14px]" />}
            iconColor="#e50914"
            title="Currency"
            value={`${currency.symbol} — ${currency.code}`}
            onClick={() => { setTempCurrency(currency); setActiveModal('currency'); }}
          />
          <IOSRow
            icon={<Bell className="w-[14px] h-[14px]" />}
            iconColor="#e50914"
            title="Default Reminder"
            value={`${reminderDays}d before`}
            onClick={() => { setTempReminder(reminderDays); setActiveModal('reminder'); }}
          />
          <IOSRow
            icon={<Trash2 className="w-[14px] h-[14px]" />}
            iconColor="#f59e0b"
            title="Clear Paid List"
            value={`${ordinal(paidClearDay)} of month`}
            onClick={() => { setTempClearDay(paidClearDay); setActiveModal('clearday'); }}
          />
          {/* Appearance — inline segmented control */}
          <IOSAppearanceRow mode={mode} theme={theme} setMode={setMode} />
        </IOSSection>

        {/* ─── NOTIFICATIONS & DATA ─── */}
        <IOSSection label="NOTIFICATIONS & DATA" index={2}>
          {/* Notifications row with inline toggle */}
          <div>
            <div className="flex items-center gap-3 px-4" style={{ minHeight: '54px' }}>
              <div
                className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6366f1ee 0%, #6366f199 100%)',
                  boxShadow: '0 2px 6px #6366f133',
                }}
              >
                <BellRing className="w-[14px] h-[14px] text-white" />
              </div>
              <motion.button
                className="flex-1 min-w-0 py-[13px] text-left"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setTempNotifPrefs(notifPrefs);
                  setActiveModal(notifStatus === 'granted' ? 'notifications' : 'notif-permission');
                }}
              >
                <p className="text-[16px] font-semibold text-white tracking-[-0.3px]">Notifications</p>
                <p className="text-[13px] mt-0.5" style={{ color: '#9ca3af' }}>{notifSubtitle}</p>
              </motion.button>
              <div className="flex-shrink-0 ml-2">
                <Switch
                  checked={notifStatus === 'granted' && notifPrefs.enabled}
                  onCheckedChange={(v) => {
                    if (notifStatus !== 'granted') {
                      setTempNotifPrefs(notifPrefs);
                      setActiveModal('notif-permission');
                      return;
                    }
                    const newPrefs = { ...notifPrefs, enabled: v };
                    saveNotificationPrefs(newPrefs);
                    setNotifPrefs(newPrefs);
                  }}
                />
              </div>
            </div>
            <div className="ml-[52px] h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <IOSRow
            icon={<Smartphone className="w-[14px] h-[14px]" />}
            iconColor="#3b82f6"
            title="Restore / Change Device"
            subtitle="Transfer data to a new device"
            onClick={() => { setPhone(''); setActiveModal('restore'); }}
            isLast={!canInstall}
          />

          {canInstall && (
            <IOSRow
              icon={<Download className="w-[14px] h-[14px]" />}
              iconColor="#3b82f6"
              title="Install App"
              subtitle={isIOS ? 'Add to Home Screen' : 'Install for quick access'}
              onClick={async () => {
                if (hasNativePrompt) {
                  const result = await promptInstall();
                  if (result === 'accepted') toast.success('App installed! 🎉');
                } else if (isIOS) {
                  setShowIOSInstructions(true);
                }
              }}
              isLast
            />
          )}
        </IOSSection>

        {/* ─── SUPPORT ─── */}
        <IOSSection label="SUPPORT" index={3}>
          <IOSRow
            icon={<MessageSquare className="w-[14px] h-[14px]" />}
            iconColor="#10b981"
            title="Feedback"
            subtitle="Send us your thoughts"
            onClick={() => {
              window.location.href = 'mailto:feedback@paytrack.app?subject=PayTrack Feedback';
            }}
          />
          <IOSRow
            icon={<Star className="w-[14px] h-[14px]" />}
            iconColor="#f59e0b"
            title="Rate App"
            subtitle="Help us improve"
            onClick={() => {
              toast.success('Thanks for your support!');
            }}
            isLast
          />
        </IOSSection>

        {/* ─── DANGER ZONE ─── */}
        <IOSSection label="DANGER ZONE" danger index={4}>
          <IOSRow
            icon={<LogOut className="w-[14px] h-[14px]" />}
            iconColor="#ef4444"
            title="Sign Out"
            subtitle="Clear local data and sign out"
            onClick={() => setActiveModal('logout')}
            destructive
            isLast
          />
        </IOSSection>

        {/* ─── Footer ─── */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveModal('about')}
          className="text-[12px] text-center mt-2 w-full py-2"
          style={{ color: '#6b7280' }}
        >
          PayTrack v2.2 · Your data is synced securely
        </motion.button>

        {/* ─────────────────────── MODALS ─────────────────────── */}

        {/* About */}
        <SettingsModal open={activeModal === 'about'} onClose={close} title="About PayTrack">
          <div className="text-center space-y-4">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl"
              style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e50914 0%, #b91c1c 100%)' }}>
                <Coins className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground">PayTrack</h3>
              <p className="text-sm text-muted-foreground">Version 2.2</p>
            </div>
            <div className="text-left space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(229,9,20,0.15)', color: '#e50914' }}>v2.2</span>
                  <span className="text-xs text-muted-foreground">Latest</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Refined tab switcher and navigation bar</li>
                  <li>Polished payment card layout</li>
                  <li>Highest expense insight on Overview</li>
                  <li>Monthly average spending tracker</li>
                  <li>Support and feedback options</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af' }}>v2.1</span>
                </div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Native pull-to-refresh</li>
                  <li>Category spending breakdown</li>
                  <li>Payment streak tracker</li>
                  <li>Date-grouped sections</li>
                </ul>
              </div>
            </div>
          </div>
        </SettingsModal>

        {/* iOS Install Instructions */}
        <AnimatePresence>
          {showIOSInstructions && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black"
                onClick={() => setShowIOSInstructions(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
                className="fixed inset-x-4 bottom-28 z-[110] max-w-sm mx-auto rounded-[20px] overflow-hidden shadow-2xl"
                style={{
                  background: 'hsl(240 3% 13% / 0.97)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-center space-y-4 p-6">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
                    style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)' }}
                  >
                    <Share className="w-7 h-7" style={{ color: '#e50914' }} />
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground">Install PayTrack</h3>
                  <div className="space-y-3 text-left">
                    {[
                      <>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline -mt-0.5" /> in your browser toolbar</>,
                      <>Scroll down and tap <strong>"Add to Home Screen"</strong></>,
                      <>Tap <strong>"Add"</strong> to install</>,
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span
                          className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: '#e50914', color: '#fff' }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-card-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowIOSInstructions(false)}
                    className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold text-white mt-2"
                    style={{ background: '#e50914', boxShadow: '0 4px 14px rgba(229,9,20,0.35)' }}
                  >
                    Got it
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Name Modal */}
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
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <User className="w-8 h-8" style={{ color: '#3b82f6' }} />
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
              className="h-12 rounded-xl text-center text-lg font-medium focus-visible:ring-1"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>
        </SettingsModal>

        {/* Currency Modal */}
        <SettingsModal open={activeModal === 'currency'} onClose={close} title="Currency" onSave={handleSaveCurrency}>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search currencies..."
                value={currencySearch}
                onChange={e => setCurrencySearch(e.target.value)}
                className="pl-9 h-11 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                        ? 'ring-1 ring-[#e50914]/30'
                        : 'text-card-foreground'
                    }`}
                    style={tempCurrency.code === c.code
                      ? { background: 'rgba(229,9,20,0.12)', color: '#e50914' }
                      : { background: 'rgba(255,255,255,0.04)' }
                    }
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

        {/* Reminder Modal */}
        <SettingsModal open={activeModal === 'reminder'} onClose={close} title="Default Reminder" onSave={handleSaveReminder}>
          <div className="space-y-6">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)' }}
              >
                <Bell className="w-8 h-8" style={{ color: '#e50914' }} />
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

        {/* Clear Day Modal */}
        <SettingsModal open={activeModal === 'clearday'} onClose={close} title="Clear Paid List" onSave={handleSaveClearDay}>
          <div className="space-y-5">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <CalendarDays className="w-8 h-8" style={{ color: '#f59e0b' }} />
              </div>
              <p className="text-sm text-muted-foreground">
                Paid payments will be automatically cleared on this day each month.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Label className="text-sm text-muted-foreground">Clear on</Label>
              <Select value={String(tempClearDay)} onValueChange={v => setTempClearDay(parseInt(v))}>
                <SelectTrigger
                  className="w-28 h-11 rounded-xl text-center font-semibold"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
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

        {/* Notification Permission Modal */}
        <AnimatePresence>
          {activeModal === 'notif-permission' && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black z-[70]"
                onClick={close}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
                className="fixed inset-x-4 top-[18%] z-[70] max-w-sm mx-auto"
              >
                <div
                  className="rounded-[20px] overflow-hidden shadow-2xl"
                  style={{
                    background: 'hsl(240 3% 13% / 0.97)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="px-6 pt-8 pb-6 text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
                      className="relative inline-flex items-center justify-center mb-5"
                    >
                      <motion.div
                        className="absolute w-28 h-28 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div
                        className="w-20 h-20 rounded-[1.25rem] flex items-center justify-center"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 12, -12, 8, -8, 0] }}
                          transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
                        >
                          <BellRing className="w-8 h-8" style={{ color: '#6366f1' }} />
                        </motion.div>
                      </div>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-[17px] font-bold text-card-foreground tracking-[-0.3px]"
                    >
                      {notifStatus === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                      className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[280px] mx-auto"
                    >
                      {notifStatus === 'denied'
                        ? 'Notifications were previously blocked. Please update your browser settings to allow them.'
                        : 'Get timely reminders for overdue, upcoming, and due-today payments so you never miss one.'}
                    </motion.p>
                  </div>
                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className="p-4"
                  >
                    {notifStatus === 'denied' ? (
                      <div className="flex gap-3">
                        <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                          <Button variant="secondary" onClick={close} className="w-full rounded-[14px] h-12 text-sm font-semibold">
                            Not Now
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                          <Button
                            className="w-full rounded-[14px] h-12 text-sm font-semibold"
                            style={{ background: '#6366f1', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                            onClick={() => {
                              setNotifStatus(getNotificationStatus());
                              if (getNotificationStatus() === 'granted') {
                                toast.success('Notifications enabled!');
                                const newPrefs = { ...notifPrefs, enabled: true };
                                saveNotificationPrefs(newPrefs);
                                setNotifPrefs(newPrefs);
                                setTempNotifPrefs(newPrefs);
                                setActiveModal('notifications');
                              } else {
                                toast.error('Still blocked — check browser/device settings');
                              }
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Status
                          </Button>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        <motion.div whileTap={{ scale: 0.97 }}>
                          <Button
                            className="w-full rounded-[14px] h-12 text-sm font-semibold"
                            style={{ background: '#6366f1', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                            onClick={async () => {
                              const granted = await requestNotificationPermission();
                              setNotifStatus(getNotificationStatus());
                              if (granted) {
                                toast.success('Notifications enabled! 🔔');
                                const newPrefs = { ...notifPrefs, enabled: true };
                                saveNotificationPrefs(newPrefs);
                                setNotifPrefs(newPrefs);
                                setTempNotifPrefs(newPrefs);
                                setActiveModal('notifications');
                              } else {
                                toast.error('Permission denied');
                                setNotifStatus(getNotificationStatus());
                              }
                            }}
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            Allow Notifications
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }}>
                          <Button variant="ghost" onClick={close} className="w-full rounded-[14px] h-11 text-sm text-muted-foreground">
                            Maybe Later
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Notification Preferences Modal */}
        <SettingsModal
          open={activeModal === 'notifications'}
          onClose={close}
          title="Notification Preferences"
          onSave={() => {
            saveNotificationPrefs(tempNotifPrefs);
            setNotifPrefs(tempNotifPrefs);
            toast.success('Notification preferences saved');
            close();
          }}
        >
          <div className="space-y-5">
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3.5"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)' }}
                >
                  <Bell className="w-4 h-4" style={{ color: '#6366f1' }} />
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
            <div className={`space-y-1 transition-opacity ${tempNotifPrefs.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
              {[
                { key: 'overdue' as const, icon: AlertTriangle, label: 'Overdue Payments', desc: 'When a payment is past due', color: '#ef4444' },
                { key: 'dueToday' as const, icon: Clock, label: 'Due Today', desc: 'Payments due on the current day', color: '#f59e0b' },
                { key: 'upcoming' as const, icon: CalendarCheck, label: 'Upcoming Reminders', desc: 'Before the due date', color: '#3b82f6' },
                { key: 'paid' as const, icon: Check, label: 'Payment Confirmed', desc: 'When you mark a payment as paid', color: '#10b981' },
              ].map(({ key, icon: Icon, label, desc, color }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
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
          </div>
        </SettingsModal>

        {/* Restore Modal */}
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
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
              >
                <RefreshCw className="w-8 h-8" style={{ color: '#3b82f6' }} />
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
              className="h-12 rounded-xl text-center text-lg font-medium tracking-wider focus-visible:ring-1"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </SettingsModal>

        {/* Logout Modal */}
        <AnimatePresence>
          {activeModal === 'logout' && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black z-[70]"
                onClick={close}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
                className="fixed inset-x-4 top-[20%] z-[70] max-w-sm mx-auto"
              >
                <div
                  className="rounded-[20px] overflow-hidden shadow-2xl"
                  style={{
                    background: 'hsl(240 3% 13% / 0.97)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="px-6 pt-8 pb-6 text-center">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
                      className="relative inline-flex items-center justify-center mb-5"
                    >
                      <motion.div
                        className="absolute w-28 h-28 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div
                        className="w-20 h-20 rounded-[1.25rem] flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: [0, -8, 0] }}
                          transition={{ delay: 0.4, duration: 0.5, ease: 'easeInOut' }}
                        >
                          <LogOut className="w-8 h-8" style={{ color: '#ef4444' }} />
                        </motion.div>
                      </div>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-[17px] font-bold text-card-foreground tracking-[-0.3px]"
                    >
                      Sign Out?
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                      className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[260px] mx-auto"
                    >
                      Your local data will be cleared. You can always restore it using your phone number.
                    </motion.p>
                  </div>
                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className="flex gap-3 p-4"
                  >
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex-1"
                    >
                      <Button
                        variant="secondary"
                        onClick={close}
                        className="w-full rounded-[14px] h-12 text-sm font-semibold"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="flex-1"
                    >
                      <Button
                        onClick={handleLogout}
                        className="w-full rounded-[14px] h-12 text-sm font-semibold"
                        style={{ background: '#ef4444', boxShadow: '0 4px 14px rgba(239,68,68,0.35)', color: '#fff' }}
                      >
                        Sign Out
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
