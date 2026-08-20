import { useEffect, useRef } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minDistance?: number;
  maxPerpendicularDistance?: number;
  enabled?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 60,
  maxPerpendicularDistance = 100,
  enabled = true
}: UseSwipeGestureOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      if (e.changedTouches.length !== 1) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Check if horizontal movement exceeds minDistance and vertical is within maxPerpendicularDistance
      if (Math.abs(deltaY) <= maxPerpendicularDistance) {
        // Swipe Right to Left (Passing finger from right to left -> deltaX is negative)
        if (deltaX < -minDistance) {
          if (onSwipeLeft) {
            onSwipeLeft();
          }
        } else if (deltaX > minDistance) {
          if (onSwipeRight) {
            onSwipeRight();
          }
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, minDistance, maxPerpendicularDistance, enabled]);
}
