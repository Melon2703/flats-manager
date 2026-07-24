import crypto from 'crypto';

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
 * Validates Telegram Web App initData HMAC SHA-256 signature.
 */
export function validateTelegramInitData(initDataStr: string, botToken: string): boolean {
  if (!initDataStr || !botToken) return false;

  try {
    const urlParams = new URLSearchParams(initDataStr);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    urlParams.delete('hash');

    const dataCheckArr: string[] = [];
    urlParams.forEach((val, key) => {
      dataCheckArr.push(`${key}=${val}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return calculatedHash === hash;
  } catch {
    return false;
  }
}

/**
 * Centralized TWA API authentication middleware helper.
 */
export function authenticateTWA(req: Request): boolean {
  const initData = req.headers.get('x-telegram-init-data') || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!initData) return false;
  if (!validateTelegramInitData(initData, botToken)) return false;

  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (!isAuthorizedUser(user.id)) return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Helper to generate valid initData string with signature for tests / dev environments.
 */
export function createTestInitData(userObj: Record<string, any>, botToken: string): string {
  const authDate = Math.floor(Date.now() / 1000).toString();
  const userJson = JSON.stringify(userObj);

  const params = new URLSearchParams();
  params.set('auth_date', authDate);
  params.set('user', userJson);

  const dataCheckArr: string[] = [];
  params.forEach((val, key) => {
    dataCheckArr.push(`${key}=${val}`);
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.set('hash', hash);
  return params.toString();
}
