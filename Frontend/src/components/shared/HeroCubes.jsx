import React, { useId } from 'react';

/**
 * Decorative isometric cubes (blue / purple / glass) used in the hero, CTA banner and page headers.
 * Purely decorative: hidden from assistive tech. Size it with className (keeps a 540:440 ratio).
 * In RTL pages you can mirror it with className="rtl:-scale-x-100".
 */
export function HeroCubes({ className = 'w-full h-auto' }) {
  const p = `hc-${useId().replace(/:/g, '')}-`;
  return (
    <svg viewBox="0 0 540 440" fill="none" className={className} aria-hidden="true" focusable="false">
<defs>
<linearGradient id={`${p}bl-t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8FD0FF"/><stop offset="1" stopColor="#4C9BEF"/></linearGradient>
<linearGradient id={`${p}bl-l`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3C8DEB"/><stop offset="1" stopColor="#2A66D4"/></linearGradient>
<linearGradient id={`${p}bl-r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A66D4"/><stop offset="1" stopColor="#1D45B0"/></linearGradient>
<linearGradient id={`${p}pu-t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8E86F0"/><stop offset="1" stopColor="#6A5BDB"/></linearGradient>
<linearGradient id={`${p}pu-l`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6A5BDB"/><stop offset="1" stopColor="#4C3FC0"/></linearGradient>
<linearGradient id={`${p}pu-r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4C3FC0"/><stop offset="1" stopColor="#352A9A"/></linearGradient>
<linearGradient id={`${p}gl-t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EAF2FF"/><stop offset="1" stopColor="#CFE0FF"/></linearGradient>
<linearGradient id={`${p}gl-l`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D5E3FF"/><stop offset="1" stopColor="#BBD0FA"/></linearGradient>
<linearGradient id={`${p}gl-r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C3D3F7"/><stop offset="1" stopColor="#AFC0F0"/></linearGradient>
</defs><g className="opacity-55 dark:opacity-25 dark:brightness-75">
<polygon points="68.0,100.0 120.0,130.0 120.0,190.0 68.0,160.0" fill={`url(#${p}gl-l)`}/>
<polygon points="120.0,130.0 172.0,100.0 172.0,160.0 120.0,190.0" fill={`url(#${p}gl-r)`}/>
<polygon points="120.0,70.0 172.0,100.0 120.0,130.0 68.0,100.0" fill={`url(#${p}gl-t)`}/>
<path d="M68.0 100.0L120.0 130.0L172.0 100.0M120.0 130.0V190.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
</g><g className="opacity-45 dark:opacity-20 dark:brightness-75">
<polygon points="359.4,85.0 420.0,120.0 420.0,190.0 359.4,155.0" fill={`url(#${p}gl-l)`}/>
<polygon points="420.0,120.0 480.6,85.0 480.6,155.0 420.0,190.0" fill={`url(#${p}gl-r)`}/>
<polygon points="420.0,50.0 480.6,85.0 420.0,120.0 359.4,85.0" fill={`url(#${p}gl-t)`}/>
<path d="M359.4 85.0L420.0 120.0L480.6 85.0M420.0 120.0V190.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
</g><g opacity="0.92">
<polygon points="167.7,202.5 250.0,250.0 250.0,345.0 167.7,297.5" fill={`url(#${p}bl-l)`}/>
<polygon points="250.0,250.0 332.3,202.5 332.3,297.5 250.0,345.0" fill={`url(#${p}bl-r)`}/>
<polygon points="250.0,155.0 332.3,202.5 250.0,250.0 167.7,202.5" fill={`url(#${p}bl-t)`}/>
<path d="M167.7 202.5L250.0 250.0L332.3 202.5M250.0 250.0V345.0" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" fill="none" strokeLinejoin="round"/>
</g><g opacity="0.95">
<polygon points="282.4,142.5 330.0,170.0 330.0,225.0 282.4,197.5" fill={`url(#${p}pu-l)`}/>
<polygon points="330.0,170.0 377.6,142.5 377.6,197.5 330.0,225.0" fill={`url(#${p}pu-r)`}/>
<polygon points="330.0,115.0 377.6,142.5 330.0,170.0 282.4,142.5" fill={`url(#${p}pu-t)`}/>
<path d="M282.4 142.5L330.0 170.0L377.6 142.5M330.0 170.0V225.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
</g><g opacity="0.9">
<polygon points="68.0,270.0 120.0,300.0 120.0,360.0 68.0,330.0" fill={`url(#${p}bl-l)`}/>
<polygon points="120.0,300.0 172.0,270.0 172.0,330.0 120.0,360.0" fill={`url(#${p}bl-r)`}/>
<polygon points="120.0,240.0 172.0,270.0 120.0,300.0 68.0,270.0" fill={`url(#${p}bl-t)`}/>
<path d="M68.0 270.0L120.0 300.0L172.0 270.0M120.0 300.0V360.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
</g><g opacity="0.95">
<polygon points="329.4,295.0 390.0,330.0 390.0,400.0 329.4,365.0" fill={`url(#${p}pu-l)`}/>
<polygon points="390.0,330.0 450.6,295.0 450.6,365.0 390.0,400.0" fill={`url(#${p}pu-r)`}/>
<polygon points="390.0,260.0 450.6,295.0 390.0,330.0 329.4,295.0" fill={`url(#${p}pu-t)`}/>
<path d="M329.4 295.0L390.0 330.0L450.6 295.0M390.0 330.0V400.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
</g><g className="opacity-80 dark:opacity-30 dark:brightness-75">
<polygon points="177.1,76.0 210.0,95.0 210.0,133.0 177.1,114.0" fill={`url(#${p}gl-l)`}/>
<polygon points="210.0,95.0 242.9,76.0 242.9,114.0 210.0,133.0" fill={`url(#${p}gl-r)`}/>
<polygon points="210.0,57.0 242.9,76.0 210.0,95.0 177.1,76.0" fill={`url(#${p}gl-t)`}/>
<path d="M177.1 76.0L210.0 95.0L242.9 76.0M210.0 95.0V133.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.0" fill="none" strokeLinejoin="round"/>
</g><g opacity="0.85">
<polygon points="442.3,219.0 470.0,235.0 470.0,267.0 442.3,251.0" fill={`url(#${p}bl-l)`}/>
<polygon points="470.0,235.0 497.7,219.0 497.7,251.0 470.0,267.0" fill={`url(#${p}bl-r)`}/>
<polygon points="470.0,203.0 497.7,219.0 470.0,235.0 442.3,219.0" fill={`url(#${p}bl-t)`}/>
<path d="M442.3 219.0L470.0 235.0L497.7 219.0M470.0 235.0V267.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.0" fill="none" strokeLinejoin="round"/>
</g><g opacity="0.7">
<polygon points="45.8,201.0 70.0,215.0 70.0,243.0 45.8,229.0" fill={`url(#${p}pu-l)`}/>
<polygon points="70.0,215.0 94.2,201.0 94.2,229.0 70.0,243.0" fill={`url(#${p}pu-r)`}/>
<polygon points="70.0,187.0 94.2,201.0 70.0,215.0 45.8,201.0" fill={`url(#${p}pu-t)`}/>
<path d="M45.8 201.0L70.0 215.0L94.2 201.0M70.0 215.0V243.0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.0" fill="none" strokeLinejoin="round"/>
</g>
    </svg>
  );
}

export default HeroCubes;
