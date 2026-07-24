import { describe, it, expect } from 'vitest';
import { isAuthorizedUser, validateTelegramInitData, createTestInitData, authenticateTWA } from '../lib/auth';

describe('Auth Security Middleware (lib/auth.ts)', () => {
  it('correctly checks user authorization against whitelist', () => {
    const allowedIds = '123456, 789012';
    expect(isAuthorizedUser(123456, allowedIds)).toBe(true);
    expect(isAuthorizedUser(789012, allowedIds)).toBe(true);
    expect(isAuthorizedUser(999999, allowedIds)).toBe(false);
    expect(isAuthorizedUser(null, allowedIds)).toBe(false);
    expect(isAuthorizedUser(undefined, allowedIds)).toBe(false);
  });

  it('validates authentic Telegram initData HMAC signatures', () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    const initDataStr = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);

    const isValid = validateTelegramInitData(initDataStr, botToken);
    expect(isValid).toBe(true);
  });

  it('rejects tampered or invalid Telegram initData', () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    const initDataStr = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    const tampered = initDataStr + '&tampered=1';

    const isValid = validateTelegramInitData(tampered, botToken);
    expect(isValid).toBe(false);
  });

  it('authenticateTWA helper verifies request headers and whitelist', () => {
    const botToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';

    const initDataValid = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    const validReq = new Request('http://localhost:3000/api/twa/flats', {
      headers: { 'x-telegram-init-data': initDataValid },
    });
    expect(authenticateTWA(validReq)).toBe(true);

    const initDataUnauthorized = createTestInitData({ id: 999999, first_name: 'Stranger' }, botToken);
    const unauthorizedReq = new Request('http://localhost:3000/api/twa/flats', {
      headers: { 'x-telegram-init-data': initDataUnauthorized },
    });
    expect(authenticateTWA(unauthorizedReq)).toBe(false);

    const missingReq = new Request('http://localhost:3000/api/twa/flats');
    expect(authenticateTWA(missingReq)).toBe(false);
  });
});
