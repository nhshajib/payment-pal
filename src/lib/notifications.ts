// Notification helper for payment reminders

const PERMISSION_KEY = 'paytrack_notif_permission';

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

export function sendNotification(title: string, body: string) {
  if (!isNotificationEnabled()) return;
  
  try {
    // Try service worker notification first (works when app is backgrounded)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'paytrack-reminder',
        } as NotificationOptions);
      });
    } else {
      // Fallback to basic notification
      new Notification(title, { body, icon: '/icons/icon-192x192.png' });
    }
  } catch {
    // Silently fail
  }
}

export function checkAndNotifyPayments(payments: Array<{
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  reminder_days: number;
}>) {
  if (!isNotificationEnabled()) return;
  
  const today = new Date();
  const notifiedKey = `paytrack_notified_${today.toISOString().slice(0, 10)}`;
  
  // Only notify once per day
  if (localStorage.getItem(notifiedKey)) return;
  
  const due = payments.filter(p => {
    if (p.is_paid) return false;
    const dueDate = new Date(p.due_date);
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= p.reminder_days;
  });
  
  if (due.length > 0) {
    const names = due.map(p => p.name).join(', ');
    sendNotification(
      `${due.length} payment${due.length > 1 ? 's' : ''} due soon`,
      `${names} — don't forget to pay!`
    );
    localStorage.setItem(notifiedKey, '1');
  }
}
