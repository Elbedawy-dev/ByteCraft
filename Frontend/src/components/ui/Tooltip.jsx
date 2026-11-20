import React, { useState, useRef } from 'react';
import clsx from 'clsx';

export function Tooltip({
  children,
  content,
  position = 'top', // 'top' | 'bottom' | 'start' | 'end'
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 150);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  if (!content) return children;

  const positionStyles = {
    top: 'bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-2',
    bottom: 'top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-2',
    start: 'top-1/2 end-full -translate-y-1/2 me-2',
    end: 'top-1/2 start-full -translate-y-1/2 ms-2',
  }[position] || 'bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-2';

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={clsx(
            'absolute z-50 px-2.5 py-1 text-xs font-medium text-on-surface bg-surface-container-highest border border-outline-variant rounded-md shadow-md whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100',
            positionStyles,
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
