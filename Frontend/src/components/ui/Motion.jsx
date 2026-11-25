import React, { useState, useCallback } from 'react';
import { m, LazyMotion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import {
  fadeUp,
  pageTransition,
  stagger,
  MOTION_TRANSITION,
  MOTION_VIEWPORT,
  STAGGER_DELAY,
} from '../../lib/motion';

const loadLayoutFeatures = () => import('../../lib/motionLayout').then((mod) => mod.default);

/**
 * Scroll-triggered reveal wrapper (runs once when entering viewport).
 * Respects MotionConfig reducedMotion="user".
 */
export function Reveal({
  as = 'div',
  variants = fadeUp,
  custom,
  delay = 0,
  viewport = MOTION_VIEWPORT,
  className = '',
  children,
  ...rest
}) {
  const Component = m[as] || m.div;
  const resolvedVariants = delay > 0
    ? {
        ...variants,
        visible: {
          ...(typeof variants.visible === 'function' ? variants.visible(custom) : variants.visible),
          transition: { ...MOTION_TRANSITION, delay },
        },
      }
    : variants;

  return (
    <Component
      variants={resolvedVariants}
      custom={custom}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Container that staggers child m.* / StaggerItem animations by 0.06s.
 */
export function Stagger({
  as = 'div',
  staggerDelay = STAGGER_DELAY,
  inView = true,
  viewport = MOTION_VIEWPORT,
  className = '',
  children,
  ...rest
}) {
  const Component = m[as] || m.div;

  if (inView) {
    return (
      <Component
        variants={stagger}
        custom={staggerDelay}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className={className}
        {...rest}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      variants={stagger}
      custom={staggerDelay}
      initial="hidden"
      animate="visible"
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Direct child of <Stagger> with 300ms item animation.
 */
export function StaggerItem({
  as = 'div',
  variants = fadeUp,
  custom,
  className = '',
  children,
  ...rest
}) {
  const Component = m[as] || m.div;
  return (
    <Component variants={variants} custom={custom} className={className} {...rest}>
      {children}
    </Component>
  );
}

/**
 * Image with smooth 300ms fade-in on load (cached images stay visible without flash).
 */
export function MotionImage({
  className = '',
  onLoad,
  onError,
  initialOpacity = 0,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);

  const imgRef = useCallback((node) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setLoaded(true);
    onError?.(e);
  };

  return (
    <m.img
      ref={imgRef}
      initial={{ opacity: loaded ? 1 : initialOpacity }}
      animate={{ opacity: loaded ? 1 : initialOpacity }}
      transition={MOTION_TRANSITION}
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
}

/**
 * Scoped LazyMotion feature provider enabling layout/layoutId projection
 * on nav indicators, tabs, and segmented toggles while the app root stays on domAnimation.
 */
export function LayoutMotion({ children }) {
  return <LazyMotion features={loadLayoutFeatures}>{children}</LazyMotion>;
}

/**
 * Shared AnimatePresence mode="wait" page outlet keyed by pathname.
 * Scrolls smoothly to top in onExitComplete between exit and enter animations.
 */
export function AnimatedOutlet({ className = '' }) {
  const { pathname } = useLocation();
  const outlet = useOutlet();

  const handleExitComplete = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={handleExitComplete}>
      <m.div
        key={pathname}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  );
}
