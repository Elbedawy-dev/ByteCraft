/**
 * ByteCraft Motion System
 * Unified timing (300ms) and easing [0.4, 0, 0.2, 1] aligned with Nexus tokens.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export const MOTION_DURATION = 0.3;
export const MOTION_DURATION_MS = 300;
export const MOTION_EASE = [0.4, 0, 0.2, 1];
export const MOTION_CSS_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
export const STAGGER_DELAY = 0.06;

/**
 * Shared native <dialog> modal/drawer controller:
 * Keeps top-layer open during 300ms Framer Motion exit, handles Esc via cancel,
 * backdrop pointerdown/up outside panel (ignoring portaled Select menus),
 * and closes natively in onExitComplete.
 */
export function useAnimatedNativeDialog({
  isOpen,
  onClose,
  preventClose = false,
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const pressedOutsideRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const handleCancel = (event) => {
      event.preventDefault();
      if (!preventClose && isOpenRef.current) {
        onClose?.();
      }
    };

    const handleClose = () => {
      dialog.returnValue = '';
      if (!preventClose && isOpenRef.current) {
        onClose?.();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose, preventClose]);

  const handleExitComplete = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog && dialog.open && !isOpenRef.current) {
      dialog.returnValue = '';
      dialog.close();
    }
  }, []);

  const isOutsidePanel = (event) => {
    const panel = panelRef.current;
    if (!panel) return false;
    const rect = panel.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };

  const handlePointerDown = useCallback((event) => {
    if (event.target instanceof Element && event.target.closest('[data-bc-select-portal]')) {
      pressedOutsideRef.current = false;
      return;
    }
    if (!closeOnBackdrop || preventClose || !panelRef.current) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = isOutsidePanel(event);
  }, [closeOnBackdrop, preventClose]);

  const handlePointerUp = useCallback((event) => {
    if (event.target instanceof Element && event.target.closest('[data-bc-select-portal]')) {
      pressedOutsideRef.current = false;
      return;
    }
    if (!closeOnBackdrop || preventClose || !panelRef.current) {
      pressedOutsideRef.current = false;
      return;
    }
    if (pressedOutsideRef.current && isOutsidePanel(event) && isOpenRef.current) {
      onClose?.();
    }
    pressedOutsideRef.current = false;
  }, [closeOnBackdrop, preventClose, onClose]);

  return {
    dialogRef,
    panelRef,
    handleExitComplete,
    handlePointerDown,
    handlePointerUp,
  };
}

/**
 * Detect mobile sheet breakpoint (< 640px Tailwind `sm`).
 */
export function useIsMobileViewport(breakpoint = 639) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

export const MOTION_TRANSITION = {
  duration: MOTION_DURATION,
  ease: MOTION_EASE,
};

export const MOTION_VIEWPORT = {
  once: true,
  amount: 0.12,
};

/**
 * Resolve horizontal offset sign based on active writing direction.
 * In LTR, "end" is positive (+x); in RTL, "end" is negative (-x).
 */
export function getDirectionSign(dir) {
  if (dir === 'rtl') return -1;
  if (dir === 'ltr') return 1;
  if (typeof document !== 'undefined' && document.documentElement?.dir === 'rtl') {
    return -1;
  }
  return 1;
}

export const fade = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: MOTION_TRANSITION,
  },
  exit: {
    opacity: 0,
    transition: MOTION_TRANSITION,
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: MOTION_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: MOTION_TRANSITION,
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: MOTION_TRANSITION,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: MOTION_TRANSITION,
  },
};

export const slideFromEnd = {
  hidden: (custom) => {
    const dir = typeof custom === 'object' && custom !== null ? custom.dir : custom;
    const distance = typeof custom === 'object' && custom !== null && typeof custom.distance === 'number'
      ? custom.distance
      : 24;
    return {
      opacity: 0,
      x: getDirectionSign(dir) * distance,
    };
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: MOTION_TRANSITION,
  },
  exit: (custom) => {
    const dir = typeof custom === 'object' && custom !== null ? custom.dir : custom;
    const distance = typeof custom === 'object' && custom !== null && typeof custom.distance === 'number'
      ? custom.distance
      : 24;
    return {
      opacity: 0,
      x: getDirectionSign(dir) * distance,
      transition: MOTION_TRANSITION,
    };
  },
};

export const slideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: MOTION_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: 24,
    transition: MOTION_TRANSITION,
  },
};

export const sheetSlideUp = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: MOTION_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: MOTION_TRANSITION,
  },
};

export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: MOTION_TRANSITION,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: MOTION_TRANSITION,
  },
};

export const stagger = {
  hidden: {},
  visible: (delay = STAGGER_DELAY) => ({
    transition: {
      staggerChildren: typeof delay === 'number' ? delay : STAGGER_DELAY,
    },
  }),
  exit: {
    transition: {
      staggerChildren: STAGGER_DELAY,
    },
  },
};

/**
 * Compute full-panel drawer slide variants aligned to logical "start" | "end" | "bottom".
 */
export function getDrawerVariants(side = 'end', dir) {
  if (side === 'bottom') {
    return {
      hidden: { opacity: 0, y: '100%' },
      visible: { opacity: 1, y: 0, transition: MOTION_TRANSITION },
      exit: { opacity: 0, y: '100%', transition: MOTION_TRANSITION },
    };
  }
  const sign = getDirectionSign(dir);
  const effectiveSide = side === 'left' || side === 'right'
    ? (side === 'right' ? 1 : -1)
    : (side === 'start' ? -sign : sign);
  const offset = effectiveSide > 0 ? '100%' : '-100%';
  return {
    hidden: { opacity: 0, x: offset },
    visible: { opacity: 1, x: 0, transition: MOTION_TRANSITION },
    exit: { opacity: 0, x: offset, transition: MOTION_TRANSITION },
  };
}

export { Reveal, Stagger, StaggerItem, MotionImage, LayoutMotion } from '../components/ui/Motion';
