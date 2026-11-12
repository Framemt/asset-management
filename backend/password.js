const crypto = require('crypto');

// Hashed format: scrypt$<saltHex>$<hashHex>
const SCHEME = 'scrypt';
const KEY_LENGTH = 64;

function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith(`${SCHEME}$`);
}

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, KEY_LENGTH).toString('hex');
  return `${SCHEME}$${salt}$${hash}`;
}

// Returns true when `plain` matches `stored`.
// Supports both scrypt hashed passwords and legacy plain-text (auto-upgrade upon login)
function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || !plain || !stored) return false;

  if (isHashed(stored)) {
    const [, salt, hash] = stored.split('$');
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = crypto.scryptSync(plain, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }

  const a = Buffer.from(String(stored));
  const b = Buffer.from(plain);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { hashPassword, verifyPassword, isHashed };
