import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { addOnlineStatusListener } from '../utils/pwa';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const cleanup = addOnlineStatusListener((online) => {
      setIsOnline(online);
      
      if (!online) {
        setShowIndicator(true);
        // Hide indicator after 5 seconds
        setTimeout(() => setShowIndicator(false), 5000);
      } else {
        setShowIndicator(false);
      }
    });

    return cleanup;
  }, []);

  if (!showIndicator || isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator show">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>You are offline. Some features may be limited, but your safety and wellbeing remain our priority.</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
