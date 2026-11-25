import React, { useId } from 'react';
import { BRAND } from '../../config/brand';

/**
 * Nexus logo mark: the "N" built from folded ribbon planes
 * (light-blue left stem, indigo diagonal, purple right stem with a lavender corner).
 * No tile/box around it. Decorative by default (the wordmark next to it is the accessible name).
 */
export function LogoMark({ className = 'w-10 h-10', title }) {
  const p = `lm-${useId().replace(/:/g, '')}-`;
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >

<defs>
<linearGradient id={`${p}a`} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#86C8FF"/><stop offset="1" stopColor="#3F86E6"/></linearGradient>
<linearGradient id={`${p}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3552C9"/><stop offset="1" stopColor="#4B3FC4"/></linearGradient>
<linearGradient id={`${p}c`} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#7C8AEF"/><stop offset="1" stopColor="#5560DA"/></linearGradient>
</defs>
<path d="M5 9 14 5v31l-9 4Z" fill={`url(#${p}a)`}/>
<path d="M14 5 23 9.5 30 40l-9-4.5Z" fill={`url(#${p}b)`}/>
<path d="M30 9 39 5v31l-9 4Z" fill={`url(#${p}c)`}/>
<path d="M30 40l9-4v-6.5L30 33Z" fill="#B3BCF8" fillOpacity=".85"/>
<path d="M14 5 23 9.5 21 14 14 11Z" fill="#fff" fillOpacity=".14"/>

    </svg>
  );
}

/**
 * Mark + wordmark exactly like the reference: "N" + NEXUS (bold, uppercase, navy).
 * tone="auto" (default): navy in the light theme, white in the dark theme.
 * tone="light": always white (navy footer / owner sidebar). tone="dark": always navy.
 * The text comes from the single brand constant (src/config/brand.js → BRAND.wordmark); `name` overrides it.
 */
export function BrandLogo({ name = BRAND.wordmark, tone = 'auto', size = 'md', className = '' }) {
  const mark = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-[26px]';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={`${mark} shrink-0`} />
      <span
        dir="ltr"
        className={`${text} font-extrabold uppercase tracking-tight leading-none ${
          tone === 'light' ? 'text-white' : tone === 'dark' ? 'text-[#0A1134]' : 'text-[#0A1134] dark:text-white'
        }`}
      >
        {name}
      </span>
    </span>
  );
}

export default LogoMark;
