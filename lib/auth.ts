import crypto from 'node:crypto';

/**
 * Checks whether a given Telegram user ID is whitelisted.
 */
export function isAuthorizedUser(userId: number | null | undefined, allowedUserIdsStr?: string): boolean {
  if (!userId) return false;
  const allowedStr = allowedUserIdsStr || process.env.TELEGRAM_ALLOWED_USER_IDS || '';
  if (!allowedStr) return false;

  const allowedIds = allowedStr
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return allowedIds.includes(String(userId));
}

/**
 * Computes Telegram Web App initData HMAC SHA-256 hash.
 */
export function computeInitDataHash(params: URLSearchParams, botToken: string): string {
  const dataCheckArr: string[] = [];
  params.forEach((val, key) => {
    if (key !== 'hash') {
      dataCheckArr.push(`${key}=${val}`);
    }
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  return crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
}

/**
 * Validates Telegram Web App initData HMAC SHA-256 signature.
 */
export function validateTelegramInitData(initDataStr: string, botToken: string): boolean {
  if (!initDataStr || !botToken) return false;

  try {
    const urlParams = new URLSearchParams(initDataStr);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    const calculatedHash = computeInitDataHash(urlParams, botToken);
    return calculatedHash === hash;
  } catch {
    return false;
  }
}

/**
 * Centralized TWA API authentication middleware helper.
 * Enforces both HMAC signature validity and Telegram User ID whitelist check.
 */
export function authenticateTWA(req: Request): boolean {
  const initData = req.headers.get('x-telegram-init-data') || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!initData) return false;
  if (!validateTelegramInitData(initData, botToken)) return false;

  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return false;

    const user = JSON.parse(userStr);
    if (!user || typeof user.id !== 'number') return false;

    return isAuthorizedUser(user.id);
  } catch {
    return false;
  }
}
