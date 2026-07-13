import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS Safari
      if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay for better UX
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed in this session
  if (isInstalled || !showInstallPrompt || !deferredPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Install Nexus Mind Care</h3>
              <p className="text-sm text-gray-600">Get quick access to mental health support</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>Access from your home screen</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <Monitor className="w-4 h-4 text-teal-600" />
            <span>Works offline for your privacy</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <Download className="w-4 h-4 text-teal-600" />
            <span>Faster loading and better performance</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-teal-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Your mental health data stays private and secure
        </p>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
