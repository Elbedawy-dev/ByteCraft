/**
 * Password Policy & Cryptographic Helpers
 *
 * Enforces:
 * - Minimum 8 characters
 * - Maximum 72 UTF-8 bytes (bcrypt truncation boundary)
 * - At least one letter and one digit
 * - Rejection of the 100+ most common passwords
 * - Rejection of passwords equal to the user's email address
 */

const DUMMY_BCRYPT_HASH = '$2b$12$dTJwDoyfvht.Tkw0/4Gn9OH/wRz4jrCi36FCyiA9isd5JQAwQVzze';

const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111',
  '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football', 'monkey', 'letmein',
  'shadow', 'master', '666666', 'qwertyuiop', '123321', 'mustang', '1234567890', 'michael',
  '654321', 'superman', '1qaz2wsx', '7777777', 'fuckyou', '121212', '000000', 'qazwsx',
  '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter',
  'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine', 'iloveyou',
  '2000', 'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel', 'starwars',
  'klaster', '112233', 'george', 'computer', 'michelle', 'jessica', 'pepper', '1111',
  'zxcvbn', '555555', '11111111', '131313', 'freedom', '777777', 'pass', 'maggie',
  '159753', 'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda', 'summer',
  'love', 'ashley', 'nicole', 'chelsea', 'biteme', 'matthew', 'access', 'yankees',
  '987654321', 'dallas', 'austin', 'thunder', 'taylor', 'matrix', 'mobilemail', 'mom',
  'monitor', 'monitoring', 'montana', 'moon', 'moscow',
  // Common alphanumeric variations that satisfy letter + number checks
  'password1', 'password12', 'password123', 'password1234', 'p@ssw0rd', 'p@ssword1',
  'pass1234', 'passw0rd', 'admin123', 'admin1234', 'qwerty123', 'qwerty1',
  'welcome1', 'welcome123', 'letmein1', 'letmein123', 'abc12345', 'abc123456',
  '1q2w3e4r', '1q2w3e4r5t', '12345678a', '123456a', 'a1234567', 'aa123456',
  'test1234', '1234qwer', 'qwer1234', 'zaq12wsx', 'iloveyou1', 'changeme1',
]);

/**
 * Validates a raw password against all security rules.
 * @param {string} password
 * @param {string} [email]
 * @returns {string[]} Array of validation error messages (empty if valid)
 */
function getPasswordValidationErrors(password, email = '') {
  const errors = [];

  if (typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
    return errors;
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    errors.push('Password must not exceed 72 bytes');
  }

  if (!/\p{L}/u.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  const normalizedLower = password.toLowerCase();
  const normalizedTrimmedLower = password.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalizedLower) || COMMON_PASSWORDS.has(normalizedTrimmedLower)) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  if (email && typeof email === 'string') {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail && normalizedTrimmedLower === normalizedEmail) {
      errors.push('Password cannot be the same as your email address');
    }
  }

  return errors;
}

module.exports = {
  DUMMY_BCRYPT_HASH,
  COMMON_PASSWORDS,
  getPasswordValidationErrors,
};
