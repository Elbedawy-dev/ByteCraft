import { useEffect } from 'react';

let activeNoIndexCount = 0;
let previousContent = null;
let createdByHook = false;

/**
 * Ensures <meta name="robots" content="noindex, nofollow" /> is present
 * while any owner page or login screen is mounted, and restores cleanly on exit.
 */
export function useNoIndexMeta() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    let meta = document.querySelector('meta[name="robots"]');
    if (activeNoIndexCount === 0) {
      if (meta) {
        previousContent = meta.getAttribute('content');
        createdByHook = false;
      } else {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
        previousContent = null;
        createdByHook = true;
      }
      meta.setAttribute('content', 'noindex, nofollow');
    }

    activeNoIndexCount += 1;

    return () => {
      activeNoIndexCount = Math.max(0, activeNoIndexCount - 1);
      if (activeNoIndexCount === 0) {
        const currentMeta = document.querySelector('meta[name="robots"]');
        if (!currentMeta) return;
        if (createdByHook) {
          currentMeta.remove();
        } else if (previousContent !== null) {
          currentMeta.setAttribute('content', previousContent);
        } else {
          currentMeta.removeAttribute('content');
        }
        previousContent = null;
        createdByHook = false;
      }
    };
  }, []);
}
