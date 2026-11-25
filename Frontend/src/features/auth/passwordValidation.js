/**
 * Client-side password policy helpers mirroring Backend/src/utils/password.js.
 */

export function getPasswordChecks(password = '') {
  const val = typeof password === 'string' ? password : '';
  const byteLength =
    typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(val).length
      : val.length;

  return {
    minLength: val.length >= 8,
    hasLetter: /\p{L}/u.test(val),
    hasNumber: /[0-9]/.test(val),
    maxBytes: byteLength <= 72,
  };
}

export function getUtf8ByteLength(str = '') {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
}
