export const INQUIRY_STATUSES = ['new', 'read', 'in_progress', 'resolved', 'archived'];

export const INQUIRY_PROJECT_TYPES = ['lms', 'ecommerce', 'custom_mern', 'consulting', 'other'];

export const INQUIRY_STATUS_BADGE_VARIANT = {
  new: 'primary',
  read: 'neutral',
  in_progress: 'warning',
  resolved: 'success',
  archived: 'neutral',
};

export const TIMELINE_BADGE_VARIANT = {
  urgent: 'error',
  standard: 'primary',
  flexible: 'neutral',
};

/**
 * Formats a phone number into digits suitable for https://wa.me/<digits>.
 * Handles Egyptian local numbers starting with 01XXXXXXXXX -> 201XXXXXXXXX.
 */
export function buildWhatsAppUrl(phone = '', message = '') {
  if (!phone) return null;
  let digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('01')) {
    digits = `20${digits.slice(1)}`;
  }
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildMailtoUrl(email = '', subject = '') {
  if (!email) return null;
  const cleanSubject = subject ? `Re: ${subject}` : '';
  return cleanSubject
    ? `mailto:${email}?subject=${encodeURIComponent(cleanSubject)}`
    : `mailto:${email}`;
}

export function isImageAttachment(att = {}) {
  if (typeof att.mimeType === 'string' && att.mimeType.startsWith('image/')) return true;
  const cleanUrl = (att.url || '').split('?')[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif)$/.test(cleanUrl);
}
