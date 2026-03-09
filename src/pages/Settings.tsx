import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/useUser';
import { useCurrency, CURRENCIES } from '@/hooks/useCurrency';
import { usePremium, ACCENT_COLORS } from '@/hooks/usePremium';
import { usePayments } from '@/hooks/usePayments';
import { supabase } from '@/integrations/supabase/client';
import PageTransition from '@/components/PageTransition';
import { toast } from 'sonner';
import {
  Search, Trash2, CalendarDays, Bell, Coins, RefreshCw, LogOut,
  ChevronRight, ChevronLeft, ChevronDown, X, Check, Smartphone, BellRing, AlertTriangle,
  Clock, CalendarCheck, Send, User, Sun, Moon, Monitor, Download, Share,
  MessageSquare, Star, Crown, Sparkles, Palette, FileDown, Layers, TrendingUp,
  Target, Settings2, Eye, Database, Info, Users, Copy, UserPlus, Clock3, Lock, Shield, Fingerprint,
} from 'lucide-react';
import { useBiometric } from '@/hooks/useBiometric';
import { useRoommates } from '@/hooks/useRoommates';
import { usePaydays } from '@/hooks/usePaydays';
import { hashPhone } from '@/lib/hash';
import { useTheme } from '@/hooks/useTheme';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useCountryCode } from '@/hooks/useCountryCode';
import {
  getNotificationPrefs, saveNotificationPrefs, type NotificationPrefs,
  requestNotificationPermission, getNotificationStatus, sendTestNotification,
} from '@/lib/notifications';

type SettingsView = 'main' | 'profile' | 'appearance' | 'notifications' | 'data' | 'roommates';

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
            <div className="rounded-t-[22px] overflow-hidden shadow-2xl bg-popover border border-border/50 border-b-0">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-[4px] rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <h2 className="text-[17px] font-bold text-foreground tracking-[-0.3px]">{title}</h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
              <div className="px-5 py-5 max-h-[55vh] overflow-y-auto">{children}</div>
              {onSave && (
                <div className="flex gap-3 px-5 py-4 border-t border-border/50 pb-safe">
                  <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1">
                    <Button variant="secondary" onClick={onClose} className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold">Cancel</Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1">
                    <Button onClick={onSave} disabled={saveDisabled} className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                      <Check className="w-4 h-4 mr-1.5" />{saveLabel}
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
function IOSSection({ label, children, index = 0 }: { label: string; children: ReactNode; danger?: boolean; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.15 }}
      className="mb-8"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.8px] mb-2 ml-4 text-muted-foreground">{label}</p>
      <div className="rounded-2xl overflow-hidden mono-card">
        {children}
      </div>
    </motion.div>
  );
}

/* ─── iOS Row ─── */
function IOSRow({
  icon, title, subtitle, value, onClick, rightElement, destructive = false, isLast = false,
  iconColor: _ic,
}: {
  icon: ReactNode; iconColor?: string; title: string; subtitle?: string; value?: string;
  onClick?: () => void; rightElement?: ReactNode; destructive?: boolean; isLast?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3.5 px-4" style={{ minHeight: '48px' }}>
      <span className="flex-shrink-0 text-muted-foreground flex">{icon}</span>
      <div className="flex-1 flex items-center justify-between min-w-0 py-[13px]">
        <div className="min-w-0 flex-1">
          <p className={`text-[16px] font-medium tracking-[-0.2px] ${destructive ? 'text-[#E50914]' : 'text-foreground'}`}>{title}</p>
          {subtitle && <p className="text-[12px] text-muted-foreground/60 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {value && <span className="text-[15px] tracking-[-0.2px] text-muted-foreground">{value}</span>}
          {rightElement}
          {onClick && !rightElement && <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {onClick ? (
        <button onClick={onClick} className="w-full text-left active:bg-secondary/30 transition-colors">
          {content}
        </button>
      ) : (
        <div>{content}</div>
      )}
      {!isLast && <div className="ml-[56px] mr-4 h-px bg-border" />}
    </>
  );
}

/* ─── Appearance segmented control ─── */
function IOSAppearanceRow({ mode, theme, setMode }: { mode: 'light' | 'auto' | 'dark'; theme: 'light' | 'dark'; setMode: (m: 'light' | 'auto' | 'dark') => void }) {
  const opts = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
  ];
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3.5 mb-3">
        <span className="text-muted-foreground flex">
          <AnimatePresence mode="wait">
            <motion.div key={theme} initial={{ rotate: -45, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 45, opacity: 0, scale: 0.6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} style={{ display: 'flex' }}>
              {theme === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </motion.div>
          </AnimatePresence>
        </span>
        <p className="text-[16px] font-medium tracking-[-0.2px] text-foreground">Appearance</p>
      </div>
      <div className="flex p-1 rounded-[10px] bg-muted">
        {opts.map(opt => {
          const Icon = opt.icon;
          const active = mode === opt.id;
          return (
            <motion.button key={opt.id} whileTap={{ scale: 0.96 }} onClick={() => setMode(opt.id)} className={`relative flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-[8px] text-[13px] font-semibold z-10 transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {active && <motion.div layoutId="appearance-thumb" className="absolute inset-0 rounded-[8px] bg-card shadow-sm" transition={{ type: 'spring', stiffness: 300, damping: 22, mass: 0.8 }} />}
              <span className="relative z-10 flex items-center gap-1"><Icon className="w-3 h-3" />{opt.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sub-page wrapper with back button ─── */
function SubPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </motion.button>
      <h1 className="font-bold text-foreground" style={{ fontSize: '28px', letterSpacing: '-0.4px', lineHeight: 1.1 }}>{title}</h1>
    </div>
  );
}

/* ─── Slide animation variants ─── */
const slideVariants = {
  enterFromRight: { x: '30%', opacity: 0 },
  enterFromLeft: { x: '-30%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitToLeft: { x: '-30%', opacity: 0 },
  exitToRight: { x: '30%', opacity: 0 },
};

/* ─── Main Settings Page ─── */
export default function Settings() {
  const { userId, userName, updateName, logout, changePin } = useUser();
  const { currency, setCurrency } = useCurrency();
  const { mode, theme, setMode } = useTheme();
  const { isPremium, setPremium, accentColor, setAccentColor } = usePremium();
  const { payments } = usePayments(userId);
  const { canInstall, isIOS, hasNativePrompt, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { roommates, loading: roommatesLoading, fetchRoommates, addRoommate, removeRoommate, getConfirmedRoommates } = useRoommates(userId);
  const [roommatePhone, setRoommatePhone] = useState('');
  const [roommateSearchResult, setRoommateSearchResult] = useState<{ found: boolean; userId?: string; name?: string; phoneHash?: string } | null>(null);
  const [roommateSearching, setRoommateSearching] = useState(false);
  const { country: loginCountry, allCountries } = useCountryCode();
  const [roommateCountry, setRoommateCountry] = useState(loginCountry);
  const [showRoommateCountryPicker, setShowRoommateCountryPicker] = useState(false);
  const [roommateCountrySearch, setRoommateCountrySearch] = useState('');

  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward');

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
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [tempNotifPrefs, setTempNotifPrefs] = useState<NotificationPrefs>(notifPrefs);
  const [notifStatus, setNotifStatus] = useState(getNotificationStatus());
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [tempBudget, setTempBudget] = useState('');
  const { payDays, updatePayDays } = usePaydays();
  const [tempPayDays, setTempPayDays] = useState<number[]>(payDays);
  const [changePinCurrent, setChangePinCurrent] = useState('');
  const [changePinNew, setChangePinNew] = useState('');
  const [changePinConfirm, setChangePinConfirm] = useState('');
  const [changePinLoading, setChangePinLoading] = useState(false);
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, enableBiometric, disableBiometric } = useBiometric();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('users').select('default_reminder_days, paid_clear_day, monthly_budget').eq('id', userId).single();
      if (data) {
        setReminderDays(data.default_reminder_days);
        setTempReminder(data.default_reminder_days);
        setPaidClearDay((data as any).paid_clear_day ?? 1);
        setTempClearDay((data as any).paid_clear_day ?? 1);
        if ((data as any).monthly_budget != null) {
          setMonthlyBudget(Number((data as any).monthly_budget));
          setTempBudget(String((data as any).monthly_budget));
        }
      }
    })();
  }, [userId]);

  const navigateTo = (view: SettingsView) => {
    setSlideDirection('forward');
    setCurrentView(view);
  };

  const navigateBack = () => {
    setSlideDirection('back');
    setCurrentView('main');
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const close = () => { setActiveModal(null); setCurrencySearch(''); };

  const handleRestore = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    setRestoreLoading(true);
    try {
      // Restore requires active session; this is a legacy feature
      toast.info('Please sign out and sign back in with your phone number');
      close();
    } catch (err: any) { toast.error(err?.message || 'No account found'); }
    finally { setRestoreLoading(false); }
  };

  const handleSaveReminder = async () => {
    setReminderDays(tempReminder);
    if (userId) await supabase.from('users').update({ default_reminder_days: tempReminder }).eq('id', userId);
    toast.success(`Reminder set to ${tempReminder} days before due`);
    close();
  };

  const handleSaveClearDay = async () => {
    setPaidClearDay(tempClearDay);
    if (userId) await supabase.from('users').update({ paid_clear_day: tempClearDay } as any).eq('id', userId);
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
    setTimeout(async () => { sessionStorage.setItem('paytrack_signed_out', '1'); await logout(); }, 1800);
  };

  const ordinal = (n: number) => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

  const handleExportCSV = useCallback(() => {
    if (!isPremium) { setActiveModal('premium'); return; }
    const headers = ['Name', 'Amount', 'Due Date', 'Category', 'Status', 'Recurring', 'Notes'];
    const rows = payments.map(p => [`"${p.name}"`, p.amount, p.due_date, p.category, p.is_paid ? 'Paid' : 'Unpaid', p.is_recurring ? 'Yes' : 'No', `"${(p.notes || '').replace(/"/g, '""')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paytrack-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Payments exported!');
  }, [isPremium, payments]);

  const handlePayPalPurchase = useCallback(async () => {
    setPaypalLoading(true);
    try {
      const { data: createData, error: createError } = await supabase.functions.invoke('paypal-payment', { body: { action: 'create-order' } });
      if (createError || !createData?.id) throw new Error(createError?.message || 'Failed to create order');
      const orderId = createData.id;
      const approvalUrl = `https://www.paypal.com/checkoutnow?token=${orderId}`;
      const popup = window.open(approvalUrl, 'paypal', 'width=500,height=700,left=200,top=100');
      const pollInterval = setInterval(async () => {
        try {
          if (popup?.closed) {
            clearInterval(pollInterval);
            const { data: captureData, error: captureError } = await supabase.functions.invoke('paypal-payment', { body: { action: 'capture-order', order_id: orderId, user_id: userId } });
            if (captureError) throw new Error(captureError.message);
            if (captureData?.success) { setPremium(true); setActiveModal(null); toast.success('Welcome to Premium! 🎉'); }
            else { toast.error('Payment was not completed. Please try again.'); }
            setPaypalLoading(false);
          }
        } catch { clearInterval(pollInterval); setPaypalLoading(false); toast.error('Payment verification failed'); }
      }, 1000);
      setTimeout(() => { clearInterval(pollInterval); if (paypalLoading) setPaypalLoading(false); }, 300000);
    } catch (err: any) { toast.error(err?.message || 'Payment failed'); setPaypalLoading(false); }
  }, [userId, setPremium, paypalLoading]);

  const notifSubtitle = notifStatus === 'denied' ? 'Blocked by browser' : notifStatus === 'granted' ? (notifPrefs.enabled ? 'Enabled' : 'Off') : 'Not set up';

  /* ─── SUB-PAGE: Profile & Account ─── */
  const renderProfile = () => (
    <div>
      <SubPageHeader title="Account & Security" onBack={navigateBack} />
      <IOSSection label="PROFILE" index={0}>
        <IOSRow
          icon={<User className="w-[18px] h-[18px]" />}
          title="Name"
          value={userName || 'Not set'}
          onClick={() => { setTempName(userName); setActiveModal('name'); }}
          isLast
        />
      </IOSSection>
      <IOSSection label="SECURITY" index={1}>
        <IOSRow
          icon={<Lock className="w-[18px] h-[18px]" />}
          title="Change PIN"
          onClick={() => { setChangePinCurrent(''); setChangePinNew(''); setChangePinConfirm(''); setActiveModal('change-pin'); }}
          isLast={!biometricAvailable}
        />
        {biometricAvailable && (
          <IOSRow
            icon={<Fingerprint className="w-[18px] h-[18px]" />}
            title="Face ID / Biometric"
            rightElement={
              <Switch
                checked={biometricEnabled}
                onCheckedChange={async (v) => {
                  if (v) {
                    const uId = userId || '';
                    const uName = userName || '';
                    // Use phoneHash from user context instead of localStorage
                    const ph = (await supabase.from('users').select('phone_hash').eq('id', uId).single()).data?.phone_hash || '';
                    const success = await enableBiometric(ph, uId, uName);
                    if (success) toast.success('Biometric login enabled');
                    else toast.error('Could not enable biometric login');
                  } else {
                    disableBiometric();
                    toast.success('Biometric login disabled');
                  }
                }}
              />
            }
            isLast
          />
        )}
      </IOSSection>
      <IOSSection label="DEVICE" index={2}>
        <IOSRow
          icon={<Smartphone className="w-[18px] h-[18px]" />}
          title="Restore / Change Device"
          onClick={() => { setPhone(''); setActiveModal('restore'); }}
          isLast={!canInstall}
        />
        {canInstall && (
          <IOSRow
            icon={<Download className="w-[18px] h-[18px]" />}
            title="Install App"
            onClick={async () => {
              if (hasNativePrompt) {
                const result = await promptInstall();
                if (result === 'accepted') toast.success('App installed! 🎉');
              } else if (isIOS) { setShowIOSInstructions(true); }
            }}
            isLast
          />
        )}
      </IOSSection>
    </div>
  );

  /* ─── SUB-PAGE: Appearance & Display ─── */
  const renderAppearance = () => (
    <div>
      <SubPageHeader title="Appearance" onBack={navigateBack} />
      <IOSSection label="THEME" index={0}>
        <IOSAppearanceRow mode={mode} theme={theme} setMode={setMode} />
      </IOSSection>
      <IOSSection label="CUSTOMIZATION" index={1}>
        <IOSRow
          icon={<Palette className="w-[18px] h-[18px]" />}
          title="Accent Color"
          value={isPremium ? ACCENT_COLORS.find(c => c.id === accentColor)?.label || 'Red' : 'Premium'}
          onClick={() => { if (!isPremium) { setActiveModal('premium'); return; } setActiveModal('accent'); }}
        />
        <IOSRow
          icon={<Coins className="w-[18px] h-[18px]" />}
          title="Currency"
          value={`${currency.symbol} — ${currency.code}`}
          onClick={() => { setTempCurrency(currency); setActiveModal('currency'); }}
          isLast
        />
      </IOSSection>
    </div>
  );

  /* ─── SUB-PAGE: Notifications & Reminders ─── */
  const renderNotifications = () => (
    <div>
      <SubPageHeader title="Notifications & Reminders" onBack={navigateBack} />
      <IOSSection label="NOTIFICATIONS" index={0}>
        <div>
          <div className="flex items-center gap-3 px-4" style={{ minHeight: '54px' }}>
            <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1ee 0%, #6366f199 100%)', boxShadow: '0 2px 6px #6366f133' }}>
              <BellRing className="w-[14px] h-[14px] text-white" />
            </div>
            <motion.button className="flex-1 min-w-0 py-[13px] text-left" whileTap={{ scale: 0.98 }} onClick={() => { setTempNotifPrefs(notifPrefs); setActiveModal(notifStatus === 'granted' ? 'notifications' : 'notif-permission'); }}>
              <p className="text-[16px] font-semibold text-card-foreground tracking-[-0.3px]">Notifications</p>
              <p className="text-[13px] mt-0.5 text-muted-foreground">{notifSubtitle}</p>
            </motion.button>
            <div className="flex-shrink-0 ml-2">
              <Switch
                checked={notifStatus === 'granted' && notifPrefs.enabled}
                onCheckedChange={(v) => {
                  if (notifStatus !== 'granted') { setTempNotifPrefs(notifPrefs); setActiveModal('notif-permission'); return; }
                  const newPrefs = { ...notifPrefs, enabled: v };
                  saveNotificationPrefs(newPrefs);
                  setNotifPrefs(newPrefs);
                }}
              />
            </div>
          </div>
        </div>
      </IOSSection>
      <IOSSection label="REMINDERS" index={1}>
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
        <IOSRow
          icon={<Target className="w-[14px] h-[14px]" />}
          iconColor="#10b981"
          title="Monthly Budget"
          value={isPremium ? (monthlyBudget ? `${monthlyBudget}` : 'Not set') : 'Premium'}
          onClick={() => { if (!isPremium) { setActiveModal('premium'); return; } setTempBudget(monthlyBudget ? String(monthlyBudget) : ''); setActiveModal('budget'); }}
        />
        <IOSRow
          icon={<CalendarDays className="w-[14px] h-[14px]" />}
          iconColor="#3b82f6"
          title="Payday Dates"
          value={payDays.map(d => ordinal(d)).join(', ')}
          onClick={() => { setTempPayDays([...payDays]); setActiveModal('paydays'); }}
          isLast
        />
      </IOSSection>
    </div>
  );

  /* ─── SUB-PAGE: Data & Export ─── */
  const renderData = () => (
    <div>
      <SubPageHeader title="Export Data" onBack={navigateBack} />
      <IOSSection label="EXPORT" index={0}>
        <IOSRow
          icon={<FileDown className="w-[18px] h-[18px]" />}
          title="Export Payments"
          value={isPremium ? 'CSV' : 'Premium'}
          onClick={handleExportCSV}
          isLast
        />
      </IOSSection>
      <IOSSection label="SUPPORT" index={1}>
        <IOSRow
          icon={<MessageSquare className="w-[18px] h-[18px]" />}
          title="Feedback"
          onClick={() => { window.location.href = 'mailto:feedback@paytrack.app?subject=PayTrack Feedback'; }}
        />
        <IOSRow
          icon={<Star className="w-[18px] h-[18px]" />}
          title="Rate App"
          onClick={() => { toast.success('Thanks for your support!'); }}
        />
        <IOSRow
          icon={<Info className="w-[18px] h-[18px]" />}
          title="About PayTrack"
          onClick={() => setActiveModal('about')}
          isLast
        />
      </IOSSection>
    </div>
  );

  /* ─── SUB-PAGE: Roommates & Partners ─── */
  const handleRoommateSearch = async () => {
    const digits = roommatePhone.replace(/\D/g, '');
    if (digits.length < 7) { toast.error('Enter a valid phone number'); return; }
    setRoommateSearching(true);
    try {
      const fullPhone = roommateCountry.dial + digits;
      const fullHash = await hashPhone(fullPhone);
      const rawHash = await hashPhone(digits);
      // Search with full phone (country code + digits) first, then raw digits
      const { data } = await supabase.from('users').select('id, name, phone_hash').eq('phone_hash', fullHash).maybeSingle();
      if (data) {
        setRoommateSearchResult({ found: true, userId: data.id, name: (data as any).name || 'User', phoneHash: fullHash });
      } else {
        const { data: data2 } = await supabase.from('users').select('id, name, phone_hash').eq('phone_hash', rawHash).maybeSingle();
        if (data2) {
          setRoommateSearchResult({ found: true, userId: data2.id, name: (data2 as any).name || 'User', phoneHash: rawHash });
        } else {
          setRoommateSearchResult({ found: false, phoneHash: fullHash });
        }
      }
    } catch { toast.error('Search failed'); }
    finally { setRoommateSearching(false); }
  };

  const handleInviteShare = async () => {
    const msg = `Hi! ${userName || 'Someone'} invited you to track shared payments on PayTrack. Download the app to get started: https://trakpay.lovable.app`;
    if (navigator.share) {
      try { await navigator.share({ title: 'PayTrack Invite', text: msg }); }
      catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(msg);
      toast.success('Invite link copied!');
    }
  };

  const [roommateNickname, setRoommateNickname] = useState('');

  const renderRoommates = () => (
    <div>
      <SubPageHeader title="Roommates & Partners" onBack={navigateBack} />

      {/* Add Roommate */}
      <IOSSection label="ADD ROOMMATE" index={0}>
        <div className="px-4 py-4 space-y-3">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Search by phone number to find someone on PayTrack, or invite them to join.
          </p>
          
          {/* Phone input row */}
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} type="button"
              onClick={() => setShowRoommateCountryPicker(true)}
              className="h-12 px-3 rounded-xl bg-secondary/50 flex items-center gap-1.5 flex-shrink-0 text-foreground"
            >
              <span className="text-base">{roommateCountry.flag}</span>
              <span className="text-xs font-medium text-muted-foreground">{roommateCountry.dial}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
            </motion.button>
            <Input
              type="tel"
              placeholder="Phone number"
              value={roommatePhone}
              onChange={e => { setRoommatePhone(e.target.value); setRoommateSearchResult(null); }}
              className="h-12 bg-secondary/50 border-0 rounded-xl text-sm flex-1"
            />
          </div>
          
          {/* Search button */}
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button 
              onClick={handleRoommateSearch} 
              disabled={roommateSearching || roommatePhone.replace(/\D/g, '').length < 7} 
              className="w-full rounded-xl h-12 text-[15px] font-semibold"
            >
              {roommateSearching ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Searching...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Find Roommate</>
              )}
            </Button>
          </motion.div>

          {/* Search Result */}
          <AnimatePresence>
            {roommateSearchResult && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} 
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="rounded-2xl overflow-hidden border border-border/50"
              >
                {roommateSearchResult.found ? (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-foreground">{roommateSearchResult.name}</p>
                        <p className="text-xs text-primary font-medium">Found on PayTrack ✓</p>
                      </div>
                    </div>
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button className="w-full rounded-xl h-11 text-sm font-semibold" onClick={async () => {
                        try {
                          await addRoommate(roommateSearchResult.phoneHash!, roommateSearchResult.userId, roommateSearchResult.name);
                          toast.success(`${roommateSearchResult.name} added as roommate!`);
                          setRoommatePhone('');
                          setRoommateSearchResult(null);
                        } catch { toast.error('Already added or error'); }
                      }}>
                        <UserPlus className="w-4 h-4 mr-2" /> Add {roommateSearchResult.name}
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-foreground">Not on PayTrack yet</p>
                        <p className="text-xs text-muted-foreground">Add a nickname and send an invite</p>
                      </div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Nickname (e.g. Alex)"
                      value={roommateNickname}
                      onChange={e => setRoommateNickname(e.target.value)}
                      className="h-11 bg-secondary/50 border-0 rounded-xl text-sm"
                      maxLength={30}
                    />
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button className="w-full rounded-xl h-11 text-sm font-semibold" onClick={async () => {
                        try {
                          await addRoommate(roommateSearchResult.phoneHash!, undefined, roommateNickname.trim() || undefined);
                          handleInviteShare();
                          setRoommatePhone('');
                          setRoommateNickname('');
                          setRoommateSearchResult(null);
                        } catch { toast.error('Already invited or error'); }
                      }}>
                        <Send className="w-4 h-4 mr-2" /> Invite & Add
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </IOSSection>

      {/* Confirmed Roommates */}
      {roommates.filter(r => r.status === 'confirmed').length > 0 && (
        <IOSSection label="CONNECTED" index={1}>
          {roommates.filter(r => r.status === 'confirmed').map((r, i, arr) => (
            <IOSRow
              key={r.id}
              icon={<User className="w-[14px] h-[14px]" />}
              iconColor="#10b981"
              title={r.partner_name || r.nickname || 'Roommate'}
              subtitle="Sharing bills"
              onClick={() => {
                if (confirm(`Remove ${r.partner_name || r.nickname || 'this roommate'}?`)) {
                  removeRoommate(r.id);
                  toast.success('Removed');
                }
              }}
              rightElement={<div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              isLast={i === arr.length - 1}
            />
          ))}
        </IOSSection>
      )}

      {/* Pending Invites */}
      {roommates.filter(r => r.status === 'pending').length > 0 && (
        <IOSSection label="PENDING INVITES" index={2}>
          {roommates.filter(r => r.status === 'pending').map((r, i, arr) => (
            <div key={r.id} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-border/30' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                  <Clock3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-foreground">{r.nickname || `Invite #${i + 1}`}</p>
                  <p className="text-xs text-muted-foreground">Waiting to join</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg border-border" onClick={handleInviteShare}>
                  <Share className="w-3 h-3 mr-1" /> Resend
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg text-destructive p-0" onClick={() => { removeRoommate(r.id); toast.success('Removed'); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </IOSSection>
      )}

      {roommates.length === 0 && !roommatesLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">No roommates yet</p>
          <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
            Search by phone number above to add a roommate and start splitting bills
          </p>
        </motion.div>
      )}
    </div>
  );

  /* ─── MAIN MENU ─── */
  const renderMain = () => (
    <div>
      {/* iOS Large Title */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-bold text-foreground" style={{ fontSize: '34px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>Settings</h1>
      </motion.header>

      {/* Profile Block */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02, type: 'spring', stiffness: 300, damping: 28 }}
        className="flex items-center gap-3.5 mb-10"
      >
        <div className="w-14 h-14 rounded-full mono-card-solid flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-muted-foreground">
            {userName ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-foreground truncate">{userName || 'User'}</p>
            {isPremium && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveModal('premium-features')}
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                Premium
              </motion.button>
            )}
          </div>
        </div>
        {!isPremium && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('premium')}
            className="flex-shrink-0 text-xs font-semibold text-primary px-3 py-1.5 rounded-full border border-border"
          >
            Upgrade
          </motion.button>
        )}
      </motion.div>

      {/* Block 1: Personal */}
      <IOSSection label="PERSONAL" index={0}>
        <IOSRow
          icon={<Shield className="w-[18px] h-[18px]" />}
          title="Account & Security"
          subtitle="PIN, biometrics, device management"
          onClick={() => navigateTo('profile')}
        />
        <IOSRow
          icon={<Users className="w-[18px] h-[18px]" />}
          title="Roommates & Shared Bills"
          subtitle="Split payments with housemates"
          onClick={() => {
            if (!isPremium) { setActiveModal('premium'); return; }
            fetchRoommates();
            navigateTo('roommates');
          }}
          isLast
        />
      </IOSSection>

      {/* Block 2: Preferences */}
      <IOSSection label="PREFERENCES" index={1}>
        <IOSRow
          icon={<Eye className="w-[18px] h-[18px]" />}
          title="Appearance"
          subtitle="Theme, accent color, currency"
          onClick={() => navigateTo('appearance')}
        />
        <IOSRow
          icon={<Bell className="w-[18px] h-[18px]" />}
          title="Notifications"
          subtitle="Reminders, budget, paydays"
          onClick={() => navigateTo('notifications')}
        />
        <IOSRow
          icon={<Database className="w-[18px] h-[18px]" />}
          title="Export Data"
          subtitle="CSV export, feedback, about"
          onClick={() => navigateTo('data')}
          isLast={!canInstall}
        />
        {canInstall && (
          <IOSRow
            icon={<Download className="w-[18px] h-[18px]" />}
            title="Install App"
            subtitle={isIOS ? 'Add to Home Screen' : 'Install to your device'}
            onClick={async () => {
              if (isIOS) {
                setShowIOSInstructions(true);
              } else {
                const result = await promptInstall();
                if (result === 'accepted') toast.success('App installed!');
              }
            }}
            isLast
          />
        )}
      </IOSSection>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 28 }}
        className="mt-12 mb-6"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveModal('logout')}
          className="w-full py-3 flex items-center justify-center"
        >
          <span className="text-lg font-semibold text-primary">Sign Out</span>
        </motion.button>
      </motion.div>

      {/* Footer */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setActiveModal('about')}
        className="text-[12px] text-center mt-2 w-full py-2 text-muted-foreground/50"
      >
        PayTrack v3.1
      </motion.button>
    </div>
  );

  return (
    <PageTransition>
      {/* Sign-out overlay */}
      <AnimatePresence>
        {signingOut && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center overflow-hidden">
            <motion.div className="absolute w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--destructive) / 0.12) 0%, transparent 70%)' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 2, opacity: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
            <motion.div initial={{ scale: 0.5, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 22 }} className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg bg-destructive/10 border border-destructive/20">
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ delay: 0.6, duration: 0.5, ease: 'easeInOut' }}><LogOut className="w-8 h-8 text-destructive" /></motion.div>
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="text-foreground text-base font-semibold mt-5 tracking-tight">See you soon!</motion.p>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.6, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="text-muted-foreground text-sm mt-1">Signing out securely…</motion.p>
            <motion.div className="mt-8 h-0.5 rounded-full overflow-hidden bg-destructive/20" initial={{ width: 0, opacity: 0 }} animate={{ width: 140, opacity: 1 }} transition={{ delay: 0.4, duration: 0.3 }}>
              <motion.div className="h-full rounded-full bg-destructive" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ delay: 0.5, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={slideDirection === 'forward' ? slideVariants.enterFromRight : slideVariants.enterFromLeft}
            animate={slideVariants.center}
            exit={slideDirection === 'forward' ? slideVariants.exitToLeft : slideVariants.exitToRight}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {currentView === 'main' && renderMain()}
            {currentView === 'profile' && renderProfile()}
            {currentView === 'appearance' && renderAppearance()}
            {currentView === 'notifications' && renderNotifications()}
            {currentView === 'data' && renderData()}
            {currentView === 'roommates' && renderRoommates()}
          </motion.div>
        </AnimatePresence>

        {/* ─────────────────────── MODALS ─────────────────────── */}

        {/* Premium Comparison Modal */}
        <SettingsModal open={activeModal === 'premium'} onClose={close} title="Premium">
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-3"><Crown className="w-8 h-8 text-primary" /></div>
              <h3 className="text-lg font-bold text-card-foreground">Unlock Premium</h3>
              <p className="text-sm text-muted-foreground mt-1">One-time purchase · $0.99</p>
            </div>
            <div className="rounded-xl border border-border/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Free</p>
              <div className="space-y-2.5">
                {[
                  { icon: CalendarCheck, text: 'Payment tracking & reminders' },
                  { icon: Bell, text: 'Push notifications' },
                  { icon: Search, text: 'Basic search' },
                  { icon: RefreshCw, text: 'Pull-to-refresh & data sync' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5"><Icon className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-card-foreground">{text}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-primary/25 p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase">Best Value</div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Premium</p>
              <div className="space-y-2.5">
                {[
                  { icon: CalendarDays, text: 'Calendar view with date navigation' },
                  { icon: Coins, text: 'Monthly budget goals & tracking' },
                  { icon: Sparkles, text: 'Spending predictions & forecasts' },
                  { icon: Layers, text: 'Recurring cost analysis (monthly + annual)' },
                  { icon: Search, text: 'Advanced search filters' },
                  { icon: Palette, text: 'Custom accent colors (6 themes)' },
                  { icon: FileDown, text: 'Export payments as CSV' },
                  { icon: TrendingUp, text: 'Advanced 6-month analytics' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5"><Icon className="w-4 h-4 text-primary" /><span className="text-sm text-card-foreground">{text}</span></div>
                ))}
              </div>
            </div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25" onClick={handlePayPalPurchase} disabled={paypalLoading}>
                {paypalLoading ? (<><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Processing...</>) : (<><Crown className="w-5 h-5 mr-2" />Pay $0.99 with PayPal</>)}
              </Button>
            </motion.div>
            <p className="text-[11px] text-center text-muted-foreground">Secure payment via PayPal · One-time charge</p>
          </div>
        </SettingsModal>

        {/* Premium Features Modal (for premium users) */}
        <SettingsModal open={activeModal === 'premium-features'} onClose={close} title="Your Premium Features">
          <div className="space-y-4">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-3">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">You have access to all premium features</p>
            </div>
            <div className="rounded-xl border border-border/50 divide-y divide-border/30">
              {[
                { icon: TrendingUp, text: 'Price Hike Alerts' },
                { icon: Eye, text: '30-Day Future Outlook' },
                { icon: CalendarDays, text: 'Calendar view with payment dots' },
                { icon: Target, text: 'Monthly budget goals & tracking' },
                { icon: Sparkles, text: 'Spending predictions & forecasts' },
                { icon: Search, text: 'Advanced search & filters' },
                { icon: Palette, text: 'Custom accent colors (6 themes)' },
                { icon: FileDown, text: 'Export payments as CSV' },
                { icon: Users, text: 'Roommates & shared bills' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" />
                  <span className="text-[15px] text-foreground flex-1">{text}</span>
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </SettingsModal>

        {/* Budget Modal */}
        <SettingsModal open={activeModal === 'budget'} onClose={close} title="Monthly Budget" onSave={async () => {
          const val = tempBudget.trim() ? Number(tempBudget) : null;
          setMonthlyBudget(val);
          if (userId) await supabase.from('users').update({ monthly_budget: val } as any).eq('id', userId);
          toast.success(val ? `Budget set to ${val}` : 'Budget cleared');
          close();
        }} saveDisabled={tempBudget.trim() !== '' && isNaN(Number(tempBudget))}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-status-success/10 border border-status-success/20 mb-4"><Target className="w-8 h-8 text-status-success" /></div>
              <p className="text-sm text-muted-foreground">Set a monthly spending limit to track your budget on the Overview page.</p>
            </div>
            <Input type="number" value={tempBudget} onChange={e => setTempBudget(e.target.value)} placeholder="Enter budget amount" className="h-12 rounded-xl text-center text-lg font-medium focus-visible:ring-1 bg-secondary border-border/50" />
            {monthlyBudget && (<button onClick={() => setTempBudget('')} className="text-xs text-destructive font-medium w-full text-center">Clear budget</button>)}
          </div>
        </SettingsModal>

        {/* Accent Color Modal */}
        <SettingsModal open={activeModal === 'accent'} onClose={close} title="Accent Color">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">Choose your app's accent color</p>
            <div className="grid grid-cols-3 gap-3">
              {ACCENT_COLORS.map(color => (
                <motion.button key={color.id} whileTap={{ scale: 0.95 }} onClick={() => setAccentColor(color.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${accentColor === color.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-secondary/30'}`}>
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: `hsl(${color.hsl})` }} />
                  <span className="text-xs font-medium text-card-foreground">{color.label}</span>
                  {accentColor === color.id && <Check className="w-3 h-3 text-primary" />}
                </motion.button>
              ))}
            </div>
          </div>
        </SettingsModal>

        {/* About */}
        <SettingsModal open={activeModal === 'about'} onClose={close} title="About PayTrack">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary"><Coins className="w-6 h-6 text-primary-foreground" /></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-card-foreground">PayTrack</h3>
              <p className="text-sm text-muted-foreground">Version 3.1</p>
            </div>
            <div className="text-left space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">v3.1</span><span className="text-xs text-muted-foreground">Latest</span></div>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Security hardening — DB input validation constraints</li>
                  <li>Fixed auth-register scalability (removed listUsers)</li>
                  <li>Improved CORS headers for all edge functions</li>
                  <li>Production logging cleanup</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v3.0</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Migrated to Supabase Auth — proper RLS per user</li>
                  <li>Removed raw phone number storage (privacy)</li>
                  <li>Edge functions for auth-register, auth-reset-pin, auth-change-pin</li>
                  <li>All data now scoped to authenticated user only</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.8</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>iOS-native country picker sheet with search</li>
                  <li>Forgot PIN recovery flow</li>
                  <li>Haptic feedback on PIN entry</li>
                  <li>Animated signup step indicators</li>
                  <li>IP-based country auto-detection</li>
                  <li>Full light/dark theme polish</li>
                  <li>Security hardening & code cleanup</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.7</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Redesigned login & signup flow (true-black iOS native)</li>
                  <li>Clickable Premium badge with feature list</li>
                  <li>Production PayPal payments</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.6</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Price Hike Alerts — subscription creep detection</li>
                  <li>30-Day Future Outlook — upcoming bill forecast</li>
                  <li>Premium upgrade paywall page</li>
                  <li>Monochrome splash screen redesign</li>
                  <li>Tap-to-open payment card action menu</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.5</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Calendar view with payment dots</li><li>Monthly budget goals & tracking</li><li>Spending predictions & forecasts</li><li>Recurring cost analysis</li><li>Advanced search filters</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.4</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Real premium features: CSV export, accent colors, analytics</li><li>PayPal payment integration</li><li>Advanced 6-month spending trend chart</li><li>Premium status synced across devices</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.3</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Premium subscription with custom themes</li><li>Redesigned bottom navigation bar</li><li>Complete light mode support</li>
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">v2.2</span></div>
                <ul className="text-sm text-muted-foreground/60 space-y-1 list-disc list-inside">
                  <li>Refined tab switcher and navigation bar</li><li>Highest expense insight on Overview</li><li>Support and feedback options</li>
                </ul>
              </div>
            </div>
          </div>
        </SettingsModal>

        {/* iOS Install Instructions */}
        <AnimatePresence>
          {showIOSInstructions && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black" onClick={() => setShowIOSInstructions(false)} />
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }} className="fixed inset-x-4 bottom-28 z-[110] max-w-sm mx-auto rounded-[20px] overflow-hidden shadow-2xl bg-popover border border-border/50">
                <div className="text-center space-y-4 p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2"><Share className="w-7 h-7 text-primary" /></div>
                  <h3 className="text-lg font-bold text-card-foreground">Install PayTrack</h3>
                  <div className="space-y-3 text-left">
                    {[
                      <>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline -mt-0.5" /> in your browser toolbar</>,
                      <>Scroll down and tap <strong>"Add to Home Screen"</strong></>,
                      <>Tap <strong>"Add"</strong> to install</>,
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl p-3 bg-secondary/50">
                        <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary text-primary-foreground">{i + 1}</span>
                        <p className="text-sm text-card-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowIOSInstructions(false)} className="w-full rounded-[14px] h-[52px] text-[17px] font-semibold text-primary-foreground bg-primary shadow-lg shadow-primary/25 mt-2">Got it</motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Name Modal */}
        <SettingsModal open={activeModal === 'name'} onClose={close} title="Your Name" onSave={async () => { await updateName(tempName.trim()); toast.success('Name updated'); close(); }} saveDisabled={!tempName.trim()}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4"><User className="w-8 h-8 text-blue-500" /></div>
              <p className="text-sm text-muted-foreground">This name will be used in your greeting.</p>
            </div>
            <Input value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Enter your name" maxLength={50} className="h-12 rounded-xl text-center text-lg font-medium focus-visible:ring-1 bg-secondary border-border/50" />
          </div>
        </SettingsModal>

        {/* Currency Modal */}
        <SettingsModal open={activeModal === 'currency'} onClose={close} title="Currency" onSave={handleSaveCurrency}>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search currencies..." value={currencySearch} onChange={e => setCurrencySearch(e.target.value)} className="pl-9 h-11 rounded-xl bg-secondary border-border/50" />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg">
              {CURRENCIES.filter(c => !currencySearch || c.name.toLowerCase().includes(currencySearch.toLowerCase()) || c.code.toLowerCase().includes(currencySearch.toLowerCase()) || c.symbol.includes(currencySearch)).map(c => (
                <motion.button key={c.code} whileTap={{ scale: 0.97 }} onClick={() => setTempCurrency(c)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all ${tempCurrency.code === c.code ? 'ring-1 ring-primary/30 bg-primary/10 text-primary' : 'text-card-foreground bg-secondary/40'}`}>
                  <span><span className="font-semibold mr-2">{c.symbol}</span>{c.name}</span>
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-4"><Bell className="w-8 h-8 text-primary" /></div>
              <p className="text-3xl font-bold text-foreground">{tempReminder}</p>
              <p className="text-muted-foreground text-sm mt-1">days before due date</p>
            </div>
            <Slider value={[tempReminder]} onValueChange={([v]) => setTempReminder(v)} min={1} max={14} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>1 day</span><span>14 days</span></div>
          </div>
        </SettingsModal>

        {/* Clear Day Modal */}
        <SettingsModal open={activeModal === 'clearday'} onClose={close} title="Clear Paid List" onSave={handleSaveClearDay}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-status-warning/10 border border-status-warning/20 mb-4"><CalendarDays className="w-8 h-8 text-status-warning" /></div>
              <p className="text-sm text-muted-foreground">Paid payments will be automatically cleared on this day each month.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Label className="text-sm text-muted-foreground">Clear on</Label>
              <Select value={String(tempClearDay)} onValueChange={v => setTempClearDay(parseInt(v))}>
                <SelectTrigger className="w-28 h-11 rounded-xl text-center font-semibold bg-secondary border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border z-[200] max-h-60">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (<SelectItem key={d} value={String(d)}>{ordinal(d)}</SelectItem>))}
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 bg-black z-[70]" onClick={close} />
              <motion.div initial={{ opacity: 0, scale: 0.88, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 40 }} transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }} className="fixed inset-x-4 top-[18%] z-[70] max-w-sm mx-auto">
                <div className="rounded-[20px] overflow-hidden shadow-2xl bg-popover border border-border/50">
                  <div className="px-6 pt-8 pb-6 text-center">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }} className="relative inline-flex items-center justify-center mb-5">
                      <motion.div className="absolute w-28 h-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                      <div className="w-20 h-20 rounded-[1.25rem] flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                        <motion.div animate={{ rotate: [0, 12, -12, 8, -8, 0] }} transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}><BellRing className="w-8 h-8 text-indigo-500" /></motion.div>
                      </div>
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-[17px] font-bold text-card-foreground tracking-[-0.3px]">
                      {notifStatus === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
                    </motion.h3>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[280px] mx-auto">
                      {notifStatus === 'denied' ? 'Notifications were previously blocked. Please update your browser settings to allow them.' : 'Get timely reminders for overdue, upcoming, and due-today payments so you never miss one.'}
                    </motion.p>
                  </div>
                  <div className="h-px bg-border/50" />
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="p-4">
                    {notifStatus === 'denied' ? (
                      <div className="flex gap-3">
                        <motion.div whileTap={{ scale: 0.96 }} className="flex-1"><Button variant="secondary" onClick={close} className="w-full rounded-[14px] h-12 text-sm font-semibold">Not Now</Button></motion.div>
                        <motion.div whileTap={{ scale: 0.96 }} className="flex-1">
                          <Button className="w-full rounded-[14px] h-12 text-sm font-semibold" style={{ background: '#6366f1', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }} onClick={() => {
                            setNotifStatus(getNotificationStatus());
                            if (getNotificationStatus() === 'granted') { toast.success('Notifications enabled!'); const newPrefs = { ...notifPrefs, enabled: true }; saveNotificationPrefs(newPrefs); setNotifPrefs(newPrefs); setTempNotifPrefs(newPrefs); setActiveModal('notifications'); }
                            else { toast.error('Still blocked — check browser/device settings'); }
                          }}><RefreshCw className="w-4 h-4 mr-2" />Refresh Status</Button>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        <motion.div whileTap={{ scale: 0.97 }}>
                          <Button className="w-full rounded-[14px] h-12 text-sm font-semibold" style={{ background: '#6366f1', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }} onClick={async () => {
                            const granted = await requestNotificationPermission();
                            setNotifStatus(getNotificationStatus());
                            if (granted) { toast.success('Notifications enabled! 🔔'); const newPrefs = { ...notifPrefs, enabled: true }; saveNotificationPrefs(newPrefs); setNotifPrefs(newPrefs); setTempNotifPrefs(newPrefs); setActiveModal('notifications'); }
                            else { toast.error('Permission denied'); setNotifStatus(getNotificationStatus()); }
                          }}><Bell className="w-4 h-4 mr-2" />Allow Notifications</Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.97 }}><Button variant="ghost" onClick={close} className="w-full rounded-[14px] h-11 text-sm text-muted-foreground">Maybe Later</Button></motion.div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Notification Preferences Modal */}
        <SettingsModal open={activeModal === 'notifications'} onClose={close} title="Notification Preferences" onSave={() => { saveNotificationPrefs(tempNotifPrefs); setNotifPrefs(tempNotifPrefs); toast.success('Notification preferences saved'); close(); }}>
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/15"><Bell className="w-4 h-4 text-indigo-500" /></div>
                <div><p className="text-sm font-medium text-card-foreground">All Notifications</p><p className="text-xs text-muted-foreground">Master toggle</p></div>
              </div>
              <Switch checked={tempNotifPrefs.enabled} onCheckedChange={(v) => setTempNotifPrefs(prev => ({ ...prev, enabled: v }))} />
            </div>
            <div className={`space-y-1 transition-opacity ${tempNotifPrefs.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
              {[
                { key: 'overdue' as const, icon: AlertTriangle, label: 'Overdue Payments', desc: 'When a payment is past due', color: '#ef4444' },
                { key: 'dueToday' as const, icon: Clock, label: 'Due Today', desc: 'Payments due on the current day', color: '#f59e0b' },
                { key: 'upcoming' as const, icon: CalendarCheck, label: 'Upcoming Reminders', desc: 'Before the due date', color: '#3b82f6' },
                { key: 'paid' as const, icon: Check, label: 'Payment Confirmed', desc: 'When you mark a payment as paid', color: '#10b981' },
              ].map(({ key, icon: Icon, label, desc, color }) => (
                <div key={key} className="flex items-center justify-between rounded-xl px-4 py-3 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}><Icon className="w-3.5 h-3.5" style={{ color }} /></div>
                    <div><p className="text-sm font-medium text-card-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                  </div>
                  <Switch checked={tempNotifPrefs[key]} onCheckedChange={(v) => setTempNotifPrefs(prev => ({ ...prev, [key]: v }))} />
                </div>
              ))}
            </div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button variant="secondary" className="w-full rounded-xl h-11" onClick={() => { sendTestNotification(); toast.success('Test notification sent!'); }}>
                <Send className="w-4 h-4 mr-2" />🧪 Test Notification
              </Button>
            </motion.div>
          </div>
        </SettingsModal>

        {/* Payday Dates Modal */}
        <SettingsModal open={activeModal === 'paydays'} onClose={close} title="Payday Dates" onSave={() => {
          updatePayDays(tempPayDays);
          toast.success(`Paydays set to ${tempPayDays.map(d => ordinal(d)).join(' & ')}`);
          close();
        }} saveDisabled={tempPayDays.length === 0}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <CalendarDays className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">Select the days of the month you get paid. This powers the Paycheck Survival card on the Insights page.</p>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => {
                const active = tempPayDays.includes(d);
                return (
                  <motion.button
                    key={d}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setTempPayDays(prev => active ? prev.filter(x => x !== d) : [...prev, d])}
                    className={`h-10 rounded-lg text-sm font-semibold transition-all ${active ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25' : 'bg-secondary/50 text-muted-foreground'}`}
                  >
                    {d}
                  </motion.button>
                );
              })}
            </div>
            {tempPayDays.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Selected: {[...tempPayDays].sort((a, b) => a - b).map(d => ordinal(d)).join(', ')}
              </p>
            )}
          </div>
        </SettingsModal>

        {/* Change PIN Modal */}
        <SettingsModal open={activeModal === 'change-pin'} onClose={close} title="Change PIN" onSave={async () => {
          if (changePinNew.length !== 4 || changePinCurrent.length !== 4) { toast.error('Enter a 4-digit PIN'); return; }
          if (changePinNew !== changePinConfirm) { toast.error('New PINs do not match'); return; }
          setChangePinLoading(true);
          try {
            await changePin(changePinCurrent, changePinNew);
            toast.success('PIN updated successfully');
            close();
          } catch (err: any) {
            toast.error(err?.message || 'Failed to update PIN');
          } finally { setChangePinLoading(false); }
        }} saveLabel={changePinLoading ? 'Saving...' : 'Update PIN'} saveDisabled={changePinLoading || changePinCurrent.length !== 4 || changePinNew.length !== 4 || changePinConfirm.length !== 4}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Enter your current PIN and choose a new 4-digit PIN.</p>
            </div>
            {[
              { label: 'Current PIN', value: changePinCurrent, setter: setChangePinCurrent },
              { label: 'New PIN', value: changePinNew, setter: setChangePinNew },
              { label: 'Confirm New PIN', value: changePinConfirm, setter: setChangePinConfirm },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.8px] mb-2 block">{label}</label>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-xl font-bold text-foreground ${i < value.length ? '' : 'text-muted-foreground/20'}`}>
                      {i < value.length ? '•' : '–'}
                    </div>
                  ))}
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={value}
                  onChange={e => setter(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full h-0 opacity-0 absolute"
                  autoFocus={label === 'Current PIN'}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={value}
                  onChange={e => setter(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full h-12 mt-2 rounded-xl bg-secondary/50 border-0 text-center text-lg tracking-[1em] text-foreground outline-none focus:ring-1 focus:ring-primary"
                  placeholder="····"
                />
              </div>
            ))}
          </div>
        </SettingsModal>

        {/* Restore Modal */}
        <SettingsModal open={activeModal === 'restore'} onClose={close} title="Restore Data" onSave={handleRestore} saveLabel={restoreLoading ? 'Restoring...' : 'Restore'} saveDisabled={restoreLoading}>
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4"><RefreshCw className="w-8 h-8 text-blue-500" /></div>
              <p className="text-sm text-muted-foreground">Enter the phone number you used during onboarding to restore your payment data.</p>
            </div>
            <Input type="tel" placeholder="10-digit phone number" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} maxLength={11} className="h-12 rounded-xl text-center text-lg font-medium tracking-wider focus-visible:ring-1 bg-secondary border-border/50" />
          </div>
        </SettingsModal>

        {/* Logout Modal */}
        <AnimatePresence>
          {activeModal === 'logout' && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 bg-black z-[70]" onClick={close} />
              <motion.div initial={{ opacity: 0, scale: 0.88, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 40 }} transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }} className="fixed inset-x-4 top-[20%] z-[70] max-w-sm mx-auto">
                <div className="rounded-[20px] overflow-hidden shadow-2xl bg-popover border border-border/50">
                  <div className="px-6 pt-8 pb-6 text-center">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }} className="relative inline-flex items-center justify-center mb-5">
                      <motion.div className="absolute w-28 h-28 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--destructive) / 0.12) 0%, transparent 70%)' }} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
                      <div className="w-20 h-20 rounded-[1.25rem] flex items-center justify-center bg-destructive/10 border border-destructive/20">
                        <motion.div initial={{ rotate: 0 }} animate={{ rotate: [0, -8, 0] }} transition={{ delay: 0.4, duration: 0.5, ease: 'easeInOut' }}><LogOut className="w-8 h-8 text-destructive" /></motion.div>
                      </div>
                    </motion.div>
                    <motion.h3 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-[17px] font-bold text-card-foreground tracking-[-0.3px]">Sign Out?</motion.h3>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[260px] mx-auto">Your local data will be cleared. You can always restore it using your phone number.</motion.p>
                  </div>
                  <div className="h-px bg-border/50" />
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="flex gap-3 p-4">
                    <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1"><Button variant="secondary" onClick={close} className="w-full rounded-[14px] h-12 text-sm font-semibold">Cancel</Button></motion.div>
                    <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex-1"><Button onClick={handleLogout} className="w-full rounded-[14px] h-12 text-sm font-semibold bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25">Sign Out</Button></motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Roommate Country Picker Modal */}
        <AnimatePresence>
          {showRoommateCountryPicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black z-[100]"
                onClick={() => setShowRoommateCountryPicker(false)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
                className="fixed bottom-0 left-0 right-0 z-[100] max-w-md mx-auto"
              >
                <div className="rounded-t-[22px] overflow-hidden bg-popover border-t border-border/50"
                  style={{ maxHeight: '85dvh' }}
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-9 h-[4px] rounded-full bg-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                    <h2 className="text-[17px] font-bold text-foreground tracking-tight">Select Country</h2>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowRoommateCountryPicker(false)}
                      className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </div>
                  <div className="px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-2.5 bg-secondary/50 rounded-xl px-3.5 py-2.5">
                      <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search country or code..."
                        value={roommateCountrySearch}
                        onChange={e => setRoommateCountrySearch(e.target.value)}
                        className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none"
                        autoFocus
                      />
                      {roommateCountrySearch && (
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => setRoommateCountrySearch('')}>
                          <X className="w-4 h-4 text-muted-foreground/40" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '60dvh' }}>
                    {(() => {
                      const filtered = roommateCountrySearch
                        ? allCountries.filter(c =>
                            c.name.toLowerCase().includes(roommateCountrySearch.toLowerCase()) ||
                            c.dial.includes(roommateCountrySearch) ||
                            c.code.toLowerCase().includes(roommateCountrySearch.toLowerCase())
                          )
                        : allCountries;
                      return filtered.length === 0 ? (
                        <div className="px-4 py-10 text-center text-muted-foreground/40 text-[14px]">No countries found</div>
                      ) : (
                        filtered.map((c, i) => (
                          <motion.button
                            key={c.code}
                            whileTap={{ backgroundColor: 'rgba(128,128,128,0.1)' }}
                            onClick={() => { setRoommateCountry(c); setShowRoommateCountryPicker(false); setRoommateCountrySearch(''); }}
                            className={`w-full flex items-center gap-3.5 px-5 h-[52px] text-left transition-colors ${
                              c.code === roommateCountry.code ? 'bg-primary/10' : ''
                            } ${i < filtered.length - 1 ? 'border-b border-border/30' : ''}`}
                          >
                            <span className="text-[22px]">{c.flag}</span>
                            <span className="text-[15px] text-foreground font-medium flex-1">{c.name}</span>
                            <span className="text-[14px] text-muted-foreground font-medium">{c.dial}</span>
                            {c.code === roommateCountry.code && (
                              <Check className="w-4 h-4 text-primary ml-1" />
                            )}
                          </motion.button>
                        ))
                      );
                    })()}
                  </div>
                  <div className="h-8" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
