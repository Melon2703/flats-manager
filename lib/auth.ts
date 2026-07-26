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

  if (allowedIds.includes('*')) return true;

  return allowedIds.includes(String(userId));
}

/**
 * Computes Telegram Web App initData HMAC SHA-256 hash using Web Crypto API.
 * Edge Runtime, Node.js (15+), and Web compatible.
 */
export async function computeInitDataHash(params: URLSearchParams, botToken: string): Promise<string> {
  const dataCheckArr: string[] = [];
  params.forEach((val, key) => {
    if (key !== 'hash') {
      dataCheckArr.push(`${key}=${val}`);
    }
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const encoder = new TextEncoder();

  // 1. Create secret key: HMAC-SHA256("WebAppData", botToken)
  const webAppDataKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const secretKeyBuffer = await crypto.subtle.sign('HMAC', webAppDataKey, encoder.encode(botToken));

  // 2. Compute final hash: HMAC-SHA256(secretKey, dataCheckString)
  const secretKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const hashBuffer = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(dataCheckString));

  // 3. Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates Telegram Web App initData HMAC SHA-256 signature.
 */
export async function validateTelegramInitData(initDataStr: string, botToken: string): Promise<boolean> {
  if (!initDataStr || !botToken) return false;

  try {
    const urlParams = new URLSearchParams(initDataStr);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    const calculatedHash = await computeInitDataHash(urlParams, botToken);
    return calculatedHash === hash;
  } catch {
    return false;
  }
}

/**
 * Centralized TWA API authentication middleware helper.
 * Enforces both HMAC signature validity and Telegram User ID whitelist check.
 * Allows dev bypass when running locally in browser (NODE_ENV === 'development' and no initData provided).
 */
export async function authenticateTWA(req: Request): Promise<boolean> {
  const initData = req.headers.get('x-telegram-init-data') || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  // Allow browser access during local development when initData is omitted
  if (process.env.NODE_ENV === 'development' && !initData) {
    return true;
  }

  if (!initData) return false;
  if (!(await validateTelegramInitData(initData, botToken))) return false;

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
