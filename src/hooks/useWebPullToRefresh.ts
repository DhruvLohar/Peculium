import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Platform, type ScrollView, type View } from 'react-native';
import { reloadIfAppUpdated } from '../utils/appUpdate';

/** Pull distance (after resistance) that arms a refresh. */
const PULL_THRESHOLD = 72;
const MAX_PULL = 150;
const RESISTANCE = 0.5;
/** How far the page stays pulled down while loading. */
export const REFRESH_HOLD = 64;
// Keep "Loading…" up at least this long so a fast refetch doesn't just flicker
const MIN_LOADING_MS = 700;
// Give up waiting on `refreshing` (e.g. queries paused offline never start)
const MAX_LOADING_MS = 10000;
const SETTLE_TRANSITION = 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1), height 260ms cubic-bezier(0.2, 0.9, 0.3, 1)';

export type PullPhase = 'idle' | 'pulling' | 'armed' | 'refreshing';

/**
 * Web only. react-native-web's RefreshControl is a no-op, so this implements pull-to-refresh with
 * touch events: the whole page is dragged down, revealing a band behind it (bandRef) whose height
 * tracks the drag. Positions are written straight to the DOM each frame, so dragging never
 * re-renders the screen; React state only changes when the band's label does.
 * Each refresh also checks for a newly deployed version and reloads into it.
 */
export const useWebPullToRefresh = (
  scrollRef: RefObject<ScrollView | null>,
  bandRef: RefObject<View | null>,
  onRefresh: (() => void) | undefined,
  refreshing: boolean
) => {
  const [phase, setPhase] = useState<PullPhase>('idle');
  const phaseRef = useRef<PullPhase>('idle');

  const startYRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const loadingStartedAtRef = useRef(0);
  const sawRefreshingRef = useRef(false);

  const enabled = Platform.OS === 'web' && !!onRefresh;

  const updatePhase = useCallback((next: PullPhase) => {
    if (phaseRef.current === next) return;
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const getNodes = useCallback(() => {
    const scrollNode = (
      scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement } | null
    )?.getScrollableNode?.();
    const bandNode = bandRef.current as unknown as HTMLElement | null;
    return { scrollNode, bandNode };
  }, [scrollRef, bandRef]);

  /** Moves the page and resizes the band. `animate` eases into place (release/settle). */
  const applyOffset = useCallback(
    (offset: number, animate: boolean) => {
      offsetRef.current = offset;
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const { scrollNode, bandNode } = getNodes();
        const transition = animate ? SETTLE_TRANSITION : 'none';
        if (scrollNode) {
          scrollNode.style.transition = transition;
          scrollNode.style.transform = offset ? `translateY(${offset}px)` : '';
        }
        if (bandNode) {
          bandNode.style.transition = transition;
          bandNode.style.height = `${offset}px`;
          // The band's edge line only exists while the page is pulled down
          bandNode.style.borderBottomWidth = offset > 0 ? '2px' : '0px';
        }
      });
    },
    [getNodes]
  );

  const finishLoading = useCallback(() => {
    const elapsed = Date.now() - loadingStartedAtRef.current;
    setTimeout(
      () => {
        applyOffset(0, true);
        updatePhase('idle');
      },
      Math.max(0, MIN_LOADING_MS - elapsed)
    );
  }, [applyOffset, updatePhase]);

  const startRefresh = useCallback(async () => {
    loadingStartedAtRef.current = Date.now();
    sawRefreshingRef.current = false;
    updatePhase('refreshing');
    applyOffset(REFRESH_HOLD, true);

    if (await reloadIfAppUpdated()) return;
    onRefresh?.();
  }, [onRefresh, applyOffset, updatePhase]);

  // End loading once the caller's refetch has started and finished
  useEffect(() => {
    if (phase !== 'refreshing') return;
    if (refreshing) {
      sawRefreshingRef.current = true;
      return;
    }
    // Finished, or never started (fresh data / paused offline): settle after a beat
    const timer = setTimeout(finishLoading, sawRefreshingRef.current ? 0 : 400);
    return () => clearTimeout(timer);
  }, [refreshing, phase, finishLoading]);

  useEffect(() => {
    if (phase !== 'refreshing') return;
    const timer = setTimeout(finishLoading, MAX_LOADING_MS);
    return () => clearTimeout(timer);
  }, [phase, finishLoading]);

  useEffect(() => {
    if (!enabled) return;
    const { scrollNode } = getNodes();
    if (!scrollNode) return;
    // The band shows through the page's own background while it's dragged down
    scrollNode.style.willChange = 'transform';

    const onTouchStart = (event: TouchEvent) => {
      const canPull = scrollNode.scrollTop <= 0 && phaseRef.current !== 'refreshing';
      startYRef.current = canPull ? event.touches[0].clientY : null;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current == null) return;
      const dy = event.touches[0].clientY - startYRef.current;
      if (dy <= 0 || scrollNode.scrollTop > 0) {
        if (offsetRef.current !== 0) {
          applyOffset(0, false);
          updatePhase('idle');
        }
        return;
      }
      // We own this gesture: stop the browser from scrolling/rubber-banding instead
      if (event.cancelable) event.preventDefault();
      const offset = Math.min(MAX_PULL, dy * RESISTANCE);
      applyOffset(offset, false);
      updatePhase(offset >= PULL_THRESHOLD ? 'armed' : 'pulling');
    };

    const onTouchEnd = () => {
      if (startYRef.current == null) return;
      startYRef.current = null;
      if (phaseRef.current === 'armed') {
        void startRefresh();
      } else {
        applyOffset(0, true);
        updatePhase('idle');
      }
    };

    scrollNode.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollNode.addEventListener('touchmove', onTouchMove, { passive: false });
    scrollNode.addEventListener('touchend', onTouchEnd);
    scrollNode.addEventListener('touchcancel', onTouchEnd);
    return () => {
      scrollNode.removeEventListener('touchstart', onTouchStart);
      scrollNode.removeEventListener('touchmove', onTouchMove);
      scrollNode.removeEventListener('touchend', onTouchEnd);
      scrollNode.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, getNodes, applyOffset, updatePhase, startRefresh]);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return { enabled, phase };
};
