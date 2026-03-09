// Notification helper for payment reminders

const PERMISSION_KEY = 'paytrack_notif_permission';
const NOTIF_PREFS_KEY = 'paytrack_notif_prefs';

export interface NotificationPrefs {
  enabled: boolean;
  overdue: boolean;
  dueToday: boolean;
  upcoming: boolean;
  paid: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  overdue: true,
  dueToday: true,
  upcoming: true,
  paid: true,
};

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const saved = localStorage.getItem(NOTIF_PREFS_KEY);
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PREFS;
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const result = await Notification.requestPermission();
  localStorage.setItem(PERMISSION_KEY, result);
  return result === 'granted';
}

export function isNotificationEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

export function getNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function sendNotification(title: string, body: string, tag?: string) {
  if (!isNotificationEnabled()) return;
  
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: tag || 'paytrack-reminder',
          vibrate: [100, 50, 100],
        } as NotificationOptions);
      });
    } else {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' });
    }
  } catch {
    // Silently fail
  }
}

// Engaging, urgent notification messages
const OVERDUE_TITLES = [
  'Your wallet is crying',
  'Houston, we have a problem',
  'Red alert — bills overdue',
  'Time to face the music',
];

const TODAY_TITLES = [
  'Today is D-Day for your bills',
  'Clock is ticking on payments',
  'No more procrastinating',
  'Bills won\'t pay themselves',
];

const UPCOMING_TITLES = [
  'Heads up — bills incoming',
  'Get ahead of your payments',
  'Future you will thank you',
  'Bills approaching fast',
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function checkAndNotifyPayments(payments: Array<{
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  reminder_days: number;
}>) {
  if (!isNotificationEnabled()) return;
  
  const prefs = getNotificationPrefs();
  if (!prefs.enabled) return;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const notifiedKey = `paytrack_notified_${todayStr}`;
  
  // Only notify once per day
  if (localStorage.getItem(notifiedKey)) return;

  const overdue: string[] = [];
  const dueToday: string[] = [];
  const upcoming: string[] = [];

  payments.forEach(p => {
    if (p.is_paid) return;
    const dueDate = new Date(p.due_date);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0 && prefs.overdue) {
      overdue.push(p.name);
    } else if (daysLeft === 0 && prefs.dueToday) {
      dueToday.push(p.name);
    } else if (daysLeft > 0 && daysLeft <= p.reminder_days && prefs.upcoming) {
      upcoming.push(p.name);
    }
  });

  if (overdue.length > 0) {
    sendNotification(
      pickRandom(OVERDUE_TITLES),
      `${overdue.length} overdue: ${overdue.join(', ')}. Handle it now.`,
      'paytrack-overdue'
    );
  }

  if (dueToday.length > 0) {
    sendNotification(
      pickRandom(TODAY_TITLES),
      `${dueToday.length} due right now: ${dueToday.join(', ')}. Don't let it slide.`,
      'paytrack-today'
    );
  }

  if (upcoming.length > 0) {
    sendNotification(
      pickRandom(UPCOMING_TITLES),
      `${upcoming.length} coming up: ${upcoming.join(', ')}. Stay sharp.`,
      'paytrack-upcoming'
    );
  }

  if (overdue.length + dueToday.length + upcoming.length > 0) {
    localStorage.setItem(notifiedKey, '1');
  }
}

/** Send a test notification to verify everything works */
export function sendTestNotification() {
  sendNotification(
    'You\'re all set',
    'Payment reminders are live. We\'ll keep you on track.',
    'paytrack-test'
  );
}

/** Cache payments in SW for background notifications */
export function cachePaymentsForSW(payments: Array<{ name: string; amount: number; due_date: string; is_paid: boolean; reminder_days: number }>) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_PAYMENTS',
      payments,
    });
  }
}

/** Cache split settlement data in SW for background notifications */
export function cacheSettlementsForSW(settlements: Array<{ fromName: string; toName: string; amount: number; amountFormatted?: string }>) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_SETTLEMENTS',
      data: { settlements },
    });
  }
}

/** Share an expense update via native share sheet */
export async function shareExpenseUpdate(opts: {
  groupName: string;
  expenseTitle: string;
  amount: string;
  paidBy: string;
  participants: string[];
  changes?: string[];
}) {
  const lines = [
    `💰 ${opts.groupName} — Expense Updated`,
    '',
    `📝 ${opts.expenseTitle}`,
    `💵 Amount: ${opts.amount}`,
    `🙋 Paid by: ${opts.paidBy}`,
    `👥 Split among: ${opts.participants.join(', ')}`,
  ];

  if (opts.changes && opts.changes.length > 0) {
    lines.push('', '📋 Changes:', ...opts.changes.map(c => `  • ${c}`));
  }

  lines.push('', '— Sent from PayTrack');

  const text = lines.join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ title: `${opts.groupName} — Expense Update`, text });
      return true;
    } catch {
      // User cancelled or share failed
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return false;
    }
  }
}

/** Register periodic background sync for payment checks */
export async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Try Periodic Background Sync (Chrome Android 80+)
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as any });
      if (status.state === 'granted') {
        await (reg as any).periodicSync.register('payment-check', {
          minInterval: 12 * 60 * 60 * 1000, // 12 hours
        });
        console.log('[PayTrack] Periodic sync registered');
      }
    }
  } catch (err) {
    console.log('[PayTrack] Periodic sync not available:', err);
  }
}
