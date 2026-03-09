// PayTrack Custom Service Worker — Background Notifications

// ── Payment notification message pools ──
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

// ── Split settlement notification pools ──
const SETTLEMENT_TITLES = [
  'Unsettled debts waiting',
  'Time to square up',
  'Split bills need attention',
  'Don\'t forget who owes what',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchAndNotify() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Check if we already notified today
    const cache = await caches.open('paytrack-notif-state');
    const notifiedResp = await cache.match('last-notified-date');
    if (notifiedResp) {
      const lastDate = await notifiedResp.text();
      if (lastDate === todayStr) return;
    }

    const notifications = [];

    // ── Payment notifications ──
    const paymentsCache = await caches.open('paytrack-payments');
    const cachedResp = await paymentsCache.match('payments-data');
    if (cachedResp) {
      const payments = await cachedResp.json();
      if (payments && payments.length > 0) {
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

        if (overdue.length > 0) {
          notifications.push(
            self.registration.showNotification(pickRandom(OVERDUE_TITLES), {
              body: `${overdue.length} overdue: ${overdue.join(', ')}. Handle it now.`,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: 'paytrack-overdue',
              vibrate: [100, 50, 100],
              data: { url: '/schedule' },
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
              data: { url: '/schedule' },
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
              data: { url: '/schedule' },
            })
          );
        }
      }
    }

    // ── Split settlement notifications ──
    const splitCache = await caches.open('paytrack-splits');
    const splitResp = await splitCache.match('settlements-data');
    if (splitResp) {
      const splitData = await splitResp.json();
      if (splitData && splitData.settlements && splitData.settlements.length > 0) {
        const summaries = splitData.settlements.slice(0, 3).map(
          s => `${s.fromName} → ${s.toName}: ${s.amountFormatted || s.amount}`
        );
        const extra = splitData.settlements.length > 3
          ? ` (+${splitData.settlements.length - 3} more)`
          : '';
        notifications.push(
          self.registration.showNotification(pickRandom(SETTLEMENT_TITLES), {
            body: `${summaries.join(', ')}${extra}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            tag: 'paytrack-settlements',
            vibrate: [100, 50, 100],
            data: { url: '/split' },
          })
        );
      }
    }

    await Promise.all(notifications);

    // Mark today as notified
    if (notifications.length > 0) {
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

// ── Push event (Web Push API) ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'PayTrack', {
        body: data.body || data.message || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: data.tag || 'paytrack-push',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' },
      })
    );
  } catch {
    // Plain text fallback
    event.waitUntil(
      self.registration.showNotification('PayTrack', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
      })
    );
  }
});

// ── Notification click → open app ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/schedule';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ── Message handler: receive data from main thread ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PAYMENTS') {
    caches.open('paytrack-payments').then(cache => {
      cache.put('payments-data', new Response(JSON.stringify(event.data.payments)));
    });
  }
  if (event.data && event.data.type === 'CACHE_SETTLEMENTS') {
    caches.open('paytrack-splits').then(cache => {
      cache.put('settlements-data', new Response(JSON.stringify(event.data.data)));
    });
  }
});
