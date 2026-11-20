import i18n from '../i18n';

/**
 * Reads a bilingual API field `{ ar, en }` using the active language,
 * falling back to the alternate language if empty.
 */
export function localized(value, lang) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);

  const active = (lang || i18n.language || 'ar').startsWith('en') ? 'en' : 'ar';
  const fallback = active === 'ar' ? 'en' : 'ar';

  const primaryVal = value[active];
  if (typeof primaryVal === 'string' && primaryVal.trim() !== '') {
    return primaryVal;
  }

  const fallbackVal = value[fallback];
  if (typeof fallbackVal === 'string' && fallbackVal.trim() !== '') {
    return fallbackVal;
  }

  return '';
}

export default localized;
