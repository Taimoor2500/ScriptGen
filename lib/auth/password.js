import bcrypt from "bcryptjs";

// 10 rounds ≈ ~100ms on modern hardware. Trade-off: higher = more CPU-bound
// defense against offline attack, but slows down our own signup/login path.
const DEFAULT_ROUNDS = 10;

/**
 * @param {string} password
 * @returns {Promise<string>}  bcrypt hash
 */
export async function hashPassword(password) {
  const rounds = Number(process.env.BCRYPT_ROUNDS || DEFAULT_ROUNDS);
  return bcrypt.hash(password, rounds);
}

/**
 * Constant-time-ish verification via bcrypt's internal compare.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
