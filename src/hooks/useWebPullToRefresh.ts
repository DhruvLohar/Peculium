import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Platform, type ScrollView } from 'react-native';
import { reloadIfAppUpdated } from '../utils/appUpdate';

/** Pull distance (after resistance) that triggers a refresh. */
export const PULL_THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.5;
// Keep the spinner up at least this long so a fast refetch doesn't just flicker
const MIN_SPIN_MS = 600;
// Give up waiting on `refreshing` (e.g. queries paused offline never start)
const MAX_SPIN_MS = 10000;

type ScrollableNode = HTMLElement;

/**
 * Web only. react-native-web's RefreshControl is a no-op, so this implements pull-to-refresh with
 * touch events on the ScrollView's DOM node. Each refresh also checks for a newly deployed version
 * of the app and reloads into it (a home-screen web app has no reload button).
 */
export const useWebPullToRefresh = (
  scrollRef: RefObject<ScrollView | null>,
  onRefresh: (() => void) | undefined,
  refreshing: boolean
) => {
  const [pull, setPull] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const pullRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const spinStartedAtRef = useRef(0);
  const sawRefreshingRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  const enabled = Platform.OS === 'web' && !!onRefresh;

  const setPullThrottled = useCallback((value: number) => {
    pullRef.current = value;
    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setPull(pullRef.current);
    });
  }, []);

  const finishSpin = useCallback(() => {
    const elapsed = Date.now() - spinStartedAtRef.current;
    setTimeout(
      () => {
        setIsSpinning(false);
        setPull(0);
        pullRef.current = 0;
      },
      Math.max(0, MIN_SPIN_MS - elapsed)
    );
  }, []);

  const trigger = useCallback(async () => {
    spinStartedAtRef.current = Date.now();
    sawRefreshingRef.current = false;
    setIsSpinning(true);
    setPull(PULL_THRESHOLD);

    if (await reloadIfAppUpdated()) return;
    onRefresh?.();
  }, [onRefresh]);

  // End the spinner once the caller's refetch has started and finished
  useEffect(() => {
    if (!isSpinning) return;
    if (refreshing) {
      sawRefreshingRef.current = true;
      return;
    }
    // Refetch finished, or never started (fresh data / paused offline): stop after a beat
    const timer = setTimeout(finishSpin, sawRefreshingRef.current ? 0 : 400);
    return () => clearTimeout(timer);
  }, [refreshing, isSpinning, finishSpin]);

  useEffect(() => {
    if (!isSpinning) return;
    const timer = setTimeout(finishSpin, MAX_SPIN_MS);
    return () => clearTimeout(timer);
  }, [isSpinning, finishSpin]);

  useEffect(() => {
    if (!enabled) return;
    const node = (
      scrollRef.current as unknown as { getScrollableNode?: () => ScrollableNode } | null
    )?.getScrollableNode?.();
    if (!node) return;

    const onTouchStart = (event: TouchEvent) => {
      startYRef.current = node.scrollTop <= 0 && !isSpinning ? event.touches[0].clientY : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current == null) return;
      const dy = event.touches[0].clientY - startYRef.current;
      if (dy <= 0 || node.scrollTop > 0) {
        if (pullRef.current !== 0) setPullThrottled(0);
        return;
      }
      // We own this gesture: stop the page from rubber-banding instead
      if (event.cancelable) event.preventDefault();
      setPullThrottled(Math.min(MAX_PULL, dy * RESISTANCE));
    };

    const onTouchEnd = () => {
      if (startYRef.current == null) return;
      startYRef.current = null;
      if (pullRef.current >= PULL_THRESHOLD) {
        void trigger();
      } else {
        setPullThrottled(0);
      }
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd);
    node.addEventListener('touchcancel', onTouchEnd);
    return () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, scrollRef, isSpinning, setPullThrottled, trigger]);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return { enabled, pull, isSpinning };
};
