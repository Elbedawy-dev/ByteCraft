/**
 * Date, number, and file-size formatting helpers.
 * All dates use Africa/Cairo timezone and Western digits in both AR and EN.
 */

const CAIRO_TIMEZONE = 'Africa/Cairo';

export function formatNumber(value, options = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('en-US', options).format(num);
}

function resolveDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, lang = 'ar', options = {}) {
  const date = resolveDate(value);
  if (!date) return '';
  const locale = lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn';
  return new Intl.DateTimeFormat(locale, {
    timeZone: CAIRO_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value, lang = 'ar', options = {}) {
  const date = resolveDate(value);
  if (!date) return '';
  const locale = lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn';
  return new Intl.DateTimeFormat(locale, {
    timeZone: CAIRO_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
}

export function formatRelativeTime(value, lang = 'ar') {
  const date = resolveDate(value);
  if (!date) return '';
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const locale = lang === 'en' ? 'en' : 'ar-EG-u-nu-latn';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second');
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');
  return rtf.format(Math.round(diffDays / 365), 'year');
}

export function formatFileSize(bytes, lang = 'ar') {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return lang === 'ar' ? '0 بايت' : '0 B';
  const units = lang === 'ar' ? ['بايت', 'ك.ب', 'م.ب', 'ج.ب'] : ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const val = size / 1024 ** index;
  const formatted = formatNumber(val, { maximumFractionDigits: index === 0 ? 0 : 1 });
  return `${formatted} ${units[index]}`;
}
