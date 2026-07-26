import { describe, it, expect } from 'vitest';
import { isAuthorizedUser, validateTelegramInitData, authenticateTWA } from '../lib/auth';
import { createTestInitData, createTestInitDataWithoutUser } from './helpers/auth-test-utils';

describe('Auth Security Middleware (lib/auth.ts)', () => {
  it('correctly checks user authorization against whitelist', () => {
    const allowedIds = '123456, 789012';
    expect(isAuthorizedUser(123456, allowedIds)).toBe(true);
    expect(isAuthorizedUser(789012, allowedIds)).toBe(true);
    expect(isAuthorizedUser(999999, allowedIds)).toBe(false);
    expect(isAuthorizedUser(null, allowedIds)).toBe(false);
    expect(isAuthorizedUser(undefined, allowedIds)).toBe(false);
    expect(isAuthorizedUser(999999, '*')).toBe(true);
  });

  it('validates authentic Telegram initData HMAC signatures', async () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    const initDataStr = await createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);

    const isValid = await validateTelegramInitData(initDataStr, botToken);
    expect(isValid).toBe(true);
  });

  it('rejects tampered or invalid Telegram initData', async () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    const initDataStr = await createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    const tampered = initDataStr + '&tampered=1';

    const isValid = await validateTelegramInitData(tampered, botToken);
    expect(isValid).toBe(false);
  });

  it('authenticateTWA verifies valid request headers and whitelisted user', async () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    (process.env as any).NODE_ENV = 'production';
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';

    const initDataValid = await createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    const validReq = new Request('http://localhost:3000/api/twa/flats', {
      headers: { 'x-telegram-init-data': initDataValid },
    });
    expect(await authenticateTWA(validReq)).toBe(true);

    const initDataUnauthorized = await createTestInitData({ id: 999999, first_name: 'Stranger' }, botToken);
    const unauthorizedReq = new Request('http://localhost:3000/api/twa/flats', {
      headers: { 'x-telegram-init-data': initDataUnauthorized },
    });
    expect(await authenticateTWA(unauthorizedReq)).toBe(false);

    const missingReq = new Request('http://localhost:3000/api/twa/flats');
    expect(await authenticateTWA(missingReq)).toBe(false);
  });

  it('authenticateTWA rejects requests with valid HMAC signature but missing user field', async () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    (process.env as any).NODE_ENV = 'production';
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';

    const initDataNoUser = await createTestInitDataWithoutUser(botToken);
    const req = new Request('http://localhost:3000/api/twa/flats', {
      headers: { 'x-telegram-init-data': initDataNoUser },
    });
    expect(await authenticateTWA(req)).toBe(false);
  });

  it('authenticateTWA allows browser requests in development mode when initData is missing', async () => {
    (process.env as any).NODE_ENV = 'development';
    const req = new Request('http://localhost:3000/api/twa/flats');
    expect(await authenticateTWA(req)).toBe(true);
  });
});
