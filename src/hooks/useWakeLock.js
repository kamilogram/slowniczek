import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock(shouldBeActive = false) {
  const [wakeLock, setWakeLock] = useState(null);
  const shouldBeActiveRef = useRef(shouldBeActive);

  // Update ref when shouldBeActive changes
  useEffect(() => {
    shouldBeActiveRef.current = shouldBeActive;
  }, [shouldBeActive]);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        // Release existing lock if any
        if (wakeLock) {
          await wakeLock.release();
        }
        
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Wake Lock active');

        lock.addEventListener('release', () => {
          console.log('Wake Lock released');
          setWakeLock(null);
        });
      } else {
        console.warn('Wake Lock API is not supported in this browser');
      }
    } catch (err) {
      console.error(`Failed to request Wake Lock: ${err.name}, ${err.message}`);
    }
  }, [wakeLock]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        console.log('Wake Lock manually released');
      } catch (err) {
        console.error(`Failed to release Wake Lock: ${err.name}, ${err.message}`);
        setWakeLock(null);
      }
    }
  }, [wakeLock]);

  // Automatically request/release based on shouldBeActive
  useEffect(() => {
    if (shouldBeActive && !wakeLock) {
      requestWakeLock();
    } else if (!shouldBeActive && wakeLock) {
      releaseWakeLock();
    }
  }, [shouldBeActive, wakeLock, requestWakeLock, releaseWakeLock]);

  // Handle visibility changes - re-request wake lock when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current && !wakeLock) {
        // Re-request wake lock when page becomes visible if it was lost
        try {
          if ('wakeLock' in navigator) {
            const lock = await navigator.wakeLock.request('screen');
            setWakeLock(lock);
            console.log('Wake Lock re-activated after visibility change');

            lock.addEventListener('release', () => {
              console.log('Wake Lock released');
              setWakeLock(null);
            });
          }
        } catch (err) {
          console.error(`Failed to re-request Wake Lock: ${err.name}, ${err.message}`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [wakeLock]);

  return { requestWakeLock, releaseWakeLock, isLocked: !!wakeLock };
}
