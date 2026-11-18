/**
 * Input & HTML Sanitization Utilities
 * 
 * WHY:
 * 1. XSS Prevention: Escapes dangerous HTML entities (&, <, >, ", ') so raw customer input
 *    can never inject executable scripts or hijack HTML layouts in notification emails or web views.
 * 2. Input Cleansing: Trims and strips control characters from user text.
 */

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  // Strip null bytes and control characters except standard whitespace
  return text.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '').trim();
}

module.exports = {
  escapeHtml,
  sanitizeText,
};
