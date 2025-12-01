import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Wake Lock active');

        lock.addEventListener('release', () => {
          console.log('Wake Lock released');
          setWakeLock(null);
        });
      }
    } catch (err) {
      console.error(`Failed to request Wake Lock: ${err.name}, ${err.message}`);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        // Re-request wake lock when page becomes visible if it was lost
        // Note: This logic might need refinement depending on desired behavior
        // For now we rely on manual request when game starts
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [wakeLock, releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock, isLocked: !!wakeLock };
}
