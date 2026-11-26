import React from 'react';
import ReactDOM from 'react-dom/client';

// Self-hosted fonts (Cairo for Arabic, Plus Jakarta Sans for English)
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';

import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';

// Material Symbols (Rounded, build-time subset font)
import './styles/material-symbols.css';

// Global Styles & Design Tokens
import './styles/index.css';

// Initialize i18n
import './i18n';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
