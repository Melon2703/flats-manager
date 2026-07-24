import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getFlats, POST as createFlat } from '../app/api/twa/flats/route';
import { GET as getFlat, PUT as updateFlat } from '../app/api/twa/flats/[id]/route';
import { GET as getTenancies, POST as createTenancy } from '../app/api/twa/tenancies/route';
import { createTestInitData } from './helpers/auth-test-utils';
import { db } from '../lib/db';

const botToken = 'test_bot_token';

describe('Flat & Tenancy Management Integration Tests', () => {
  beforeEach(async () => {
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
    await db.reset();
  });

  const getValidHeaders = () => {
    const initDataStr = createTestInitData({ id: 123456, first_name: 'Anya' }, botToken);
    return {
      'x-telegram-init-data': initDataStr,
      'Content-Type': 'application/json',
    };
  };

  it('allows creating, retrieving, and updating a flat record', async () => {
    // 1. Create Flat
    const createReq = new Request('http://localhost:3000/api/twa/flats', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({
        title: 'Flat 404 - Skyline',
        address: 'Nevsky Pr. 100, Flat 404',
        status: 'vacant',
      }),
    });

    const createRes = await createFlat(createReq);
    expect(createRes.status).toBe(201);
    const createdFlat = await createRes.json();
    expect(createdFlat.id).toBeDefined();
    expect(createdFlat.title).toBe('Flat 404 - Skyline');
    expect(createdFlat.status).toBe('vacant');

    // 2. List Flats
    const listFlatsReq = new Request('http://localhost:3000/api/twa/flats', {
      method: 'GET',
      headers: getValidHeaders(),
    });
    const listFlatsRes = await getFlats(listFlatsReq);
    expect(listFlatsRes.status).toBe(200);
    const listedFlats = await listFlatsRes.json();
    expect(listedFlats.length).toBe(1);
    expect(listedFlats[0].id).toBe(createdFlat.id);

    // 3. Retrieve Single Flat
    const getReq = new Request(`http://localhost:3000/api/twa/flats/${createdFlat.id}`, {
      method: 'GET',
      headers: getValidHeaders(),
    });
    const getRes = await getFlat(getReq, { params: Promise.resolve({ id: createdFlat.id }) });
    expect(getRes.status).toBe(200);
    const fetchedFlat = await getRes.json();
    expect(fetchedFlat.title).toBe('Flat 404 - Skyline');

    // 4. Update Flat
    const updateReq = new Request(`http://localhost:3000/api/twa/flats/${createdFlat.id}`, {
      method: 'PUT',
      headers: getValidHeaders(),
      body: JSON.stringify({
        title: 'Flat 404 - Renamed',
        address: 'Nevsky Pr. 100, Flat 404',
        status: 'active',
      }),
    });
    const updateRes = await updateFlat(updateReq, { params: Promise.resolve({ id: createdFlat.id }) });
    expect(updateRes.status).toBe(200);
    const updatedFlat = await updateRes.json();
    expect(updatedFlat.title).toBe('Flat 404 - Renamed');
    expect(updatedFlat.status).toBe('active');
  });

  it('creates tenancy and links it with flat, capturing full tenancy details', async () => {
    const flat = await db.createFlat({
      title: 'Flat 505 - Lakeview',
      address: 'Ozernaya St 12',
      status: 'vacant',
    });

    const tenancyReq = new Request('http://localhost:3000/api/twa/tenancies', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({
        flat_id: flat.id,
        tenant_name: 'Elena Smirnova',
        tenant_contact: '+7 900 123-45-67',
        start_date: '2026-08-01',
        end_date: '2027-07-31',
        rent_amount: 55000,
        deposit_amount: 55000,
        due_day: 10,
        status: 'active',
      }),
    });

    const tenancyRes = await createTenancy(tenancyReq);
    expect(tenancyRes.status).toBe(201);
    const tenancy = await tenancyRes.json();
    expect(tenancy.id).toBeDefined();
    expect(tenancy.flat_id).toBe(flat.id);
    expect(tenancy.tenant_name).toBe('Elena Smirnova');
    expect(tenancy.rent_amount).toBe(55000);
    expect(tenancy.deposit_amount).toBe(55000);
    expect(tenancy.due_day).toBe(10);

    // Flat status should update to active / occupied
    const updatedFlat = await db.getFlat(flat.id);
    expect(updatedFlat?.status).toBe('active');

    // List tenancies for flat
    const listReq = new Request(`http://localhost:3000/api/twa/tenancies?flat_id=${flat.id}`, {
      method: 'GET',
      headers: getValidHeaders(),
    });
    const listRes = await getTenancies(listReq);
    expect(listRes.status).toBe(200);
    const tenancies = await listRes.json();
    expect(tenancies.length).toBe(1);
    expect(tenancies[0].tenant_name).toBe('Elena Smirnova');
  });

  it('validates required fields when creating flat and tenancy', async () => {
    // Flat validation
    const invalidFlatReq = new Request('http://localhost:3000/api/twa/flats', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({ title: '' }),
    });
    const invalidFlatRes = await createFlat(invalidFlatReq);
    expect(invalidFlatRes.status).toBe(400);

    // Tenancy validation
    const invalidTenancyReq = new Request('http://localhost:3000/api/twa/tenancies', {
      method: 'POST',
      headers: getValidHeaders(),
      body: JSON.stringify({ tenant_name: 'Nobody' }), // missing flat_id
    });
    const invalidTenancyRes = await createTenancy(invalidTenancyReq);
    expect(invalidTenancyRes.status).toBe(400);
  });
});
