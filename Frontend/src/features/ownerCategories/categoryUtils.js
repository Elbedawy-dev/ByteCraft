/**
 * Generates a URL-safe lowercase category key matching `/^[a-z0-9-]+$/`
 * from an English category name.
 */
export function suggestCategoryKey(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
