import crypto from 'crypto';

const SECRET = process.env.SECRET_KEY || 'default-secret-for-dev-only';
const WINDOW_MS = 15000; // 15 seconds

export function generateToken(sessionId: string, timeOffset = 0): string {
  const window = Math.floor((Date.now() + timeOffset) / WINDOW_MS);
  const data = `${sessionId}:${window}`;
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex').substring(0, 16);
}

export function validateToken(sessionId: string, token: string): boolean {
  // Check current window and previous 4 windows (to allow for ~1 minute grace period to type ID)
  for (let i = 0; i <= 4; i++) {
    if (token === generateToken(sessionId, -WINDOW_MS * i)) {
      return true;
    }
  }
  return false;
}
