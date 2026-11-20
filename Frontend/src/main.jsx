import React from 'react';
import ReactDOM from 'react-dom/client';

// Self-hosted fonts (Cairo for Arabic, Inter for English)
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

// Material Symbols (Outlined, self-hosted via npm)
import 'material-symbols/outlined.css';

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
