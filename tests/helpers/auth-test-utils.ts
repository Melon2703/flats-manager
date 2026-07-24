import { computeInitDataHash } from '../../lib/auth';

/**
 * Helper to generate valid initData string with signature for tests / dev environments.
 */
export async function createTestInitData(userObj: Record<string, any>, botToken: string): Promise<string> {
  const authDate = Math.floor(Date.now() / 1000).toString();
  const userJson = JSON.stringify(userObj);

  const params = new URLSearchParams();
  params.set('auth_date', authDate);
  params.set('user', userJson);

  const hash = await computeInitDataHash(params, botToken);
  params.set('hash', hash);
  return params.toString();
}

/**
 * Helper to generate valid initData string WITHOUT user object for testing edge cases.
 */
export async function createTestInitDataWithoutUser(botToken: string): Promise<string> {
  const authDate = Math.floor(Date.now() / 1000).toString();
  const params = new URLSearchParams();
  params.set('auth_date', authDate);

  const hash = await computeInitDataHash(params, botToken);
  params.set('hash', hash);
  return params.toString();
}
