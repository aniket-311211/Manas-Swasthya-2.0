// PWA Utility Functions for Nexus Mind Care

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  // In development: unregister any existing service worker and clear caches so
  // stale production assets never pollute the dev server.
  if (!import.meta.env.PROD) {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    return null;
  }
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('Service Worker not supported');
    return null;
  }
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const addOnlineStatusListener = (callback: (isOnline: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return 'denied';
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    });
  }
};

export const isPWAInstalled = (): boolean => {
  // Check if running as PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS Safari
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return true;
  }
  
  return false;
};

/**
 * Not in lib.dom — `beforeinstallprompt` is a Chromium extension to the spec,
 * so the type has to be declared rather than imported.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export const getInstallPrompt = (): Promise<BeforeInstallPromptEvent | null> => {
  return new Promise((resolve) => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      resolve(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { once: true });
    
    // Resolve with null after 5 seconds if no prompt
    setTimeout(() => resolve(null), 5000);
  });
};

// Mental health specific PWA features
export const showOfflineSupportMessage = (): void => {
  if (!isOnline()) {
    showNotification('You are offline', {
      body: 'Some features may be limited, but your safety and wellbeing remain our priority.',
      tag: 'offline-support'
    });
  }
};

export const showMentalHealthReminder = (): void => {
  const messages = [
    'Take a moment to check in with yourself. How are you feeling today?',
    'Remember to practice self-care. You deserve kindness and compassion.',
    'It\'s okay to not be okay. Reach out if you need support.',
    'Take a deep breath. You are doing your best, and that is enough.',
    'Your mental health matters. Take time for yourself today.'
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  showNotification('Mental Health Reminder', {
    body: randomMessage,
    tag: 'mental-health-reminder'
  });
};
