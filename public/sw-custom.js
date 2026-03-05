// PayTrack Custom Service Worker — Background Notifications
// This is imported by the VitePWA-generated service worker

const SUPABASE_URL = 'https://ubekgmqoqheqaqihnowl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViZWtnbXFvcWhlcWFxaWhub3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzM4MTUsImV4cCI6MjA4Njk0OTgxNX0.ZBr2Qqfsv-TBcTHGtzNYm4HhRkuPzfrHlI8Li51QhCQ';

// ── Notification message pools ──
const OVERDUE_TITLES = [
  'Your wallet is crying',
  'Houston, we have a problem',
  'Red alert — bills overdue',
  'Time to face the music',
];
const TODAY_TITLES = [
  "Today is D-Day for your bills",
  'Clock is ticking on payments',
  'No more procrastinating',
  "Bills won't pay themselves",
];
const UPCOMING_TITLES = [
  'Heads up — bills incoming',
  'Get ahead of your payments',
  'Future you will thank you',
  'Bills approaching fast',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchAndNotify() {
  try {
    // Get auth token from IndexedDB (Supabase stores it there)
    // Fallback: try fetching with anon key and rely on RLS
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Check if we already notified today
    const cache = await caches.open('paytrack-notif-state');
    const notifiedResp = await cache.match('last-notified-date');
    if (notifiedResp) {
      const lastDate = await notifiedResp.text();
      if (lastDate === todayStr) return; // Already notified today
    }

    // Try to get cached payments from the app's localStorage via a message
    // Since SW can't access localStorage, we use cached payment data
    const paymentsCache = await caches.open('paytrack-payments');
    const cachedResp = await paymentsCache.match('payments-data');
    if (!cachedResp) return;

    const payments = await cachedResp.json();
    if (!payments || payments.length === 0) return;

    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    payments.forEach(p => {
      if (p.is_paid) return;
      const dueDate = new Date(p.due_date);
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) overdue.push(p.name);
      else if (daysLeft === 0) dueToday.push(p.name);
      else if (daysLeft > 0 && daysLeft <= (p.reminder_days || 3)) upcoming.push(p.name);
    });

    const notifications = [];

    if (overdue.length > 0) {
      notifications.push(
        self.registration.showNotification(pickRandom(OVERDUE_TITLES), {
          body: `${overdue.length} overdue: ${overdue.join(', ')}. Handle it now.`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'paytrack-overdue',
          vibrate: [100, 50, 100],
        })
      );
    }

    if (dueToday.length > 0) {
      notifications.push(
        self.registration.showNotification(pickRandom(TODAY_TITLES), {
          body: `${dueToday.length} due right now: ${dueToday.join(', ')}. Don't let it slide.`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'paytrack-today',
          vibrate: [100, 50, 100],
        })
      );
    }

    if (upcoming.length > 0) {
      notifications.push(
        self.registration.showNotification(pickRandom(UPCOMING_TITLES), {
          body: `${upcoming.length} coming up: ${upcoming.join(', ')}. Stay sharp.`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: 'paytrack-upcoming',
          vibrate: [100, 50, 100],
        })
      );
    }

    await Promise.all(notifications);

    // Mark today as notified
    if (overdue.length + dueToday.length + upcoming.length > 0) {
      await cache.put('last-notified-date', new Response(todayStr));
    }
  } catch (err) {
    console.error('[PayTrack SW] Background notification check failed:', err);
  }
}

// ── Periodic Background Sync (Chrome Android) ──
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'payment-check') {
    event.waitUntil(fetchAndNotify());
  }
});

// ── Notification click → open app ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow('/schedule');
    })
  );
});

// ── Message handler: receive payment data from main thread ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PAYMENTS') {
    caches.open('paytrack-payments').then(cache => {
      cache.put('payments-data', new Response(JSON.stringify(event.data.payments)));
    });
  }
});
