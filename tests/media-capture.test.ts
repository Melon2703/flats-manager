import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../app/api/telegram/webhook/route';
import { db } from '../lib/db';
import { transcribeVoiceNote, parseReceiptImage, parseMeterImage } from '../lib/ai';
import { uploadMediaToStorage } from '../lib/supabase';

describe('Bot Media Forward Capture & Voice STT Transcription (Ticket 6)', () => {
  beforeEach(async () => {
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456';
    process.env.TELEGRAM_BOT_TOKEN = 'test_token';
    await db.reset();
  });

  it('uploads media buffer to Supabase storage helper and returns public storage URL', async () => {
    const dummyBuffer = Buffer.from('fake image data');
    const storageUrl = await uploadMediaToStorage(dummyBuffer, 'test-receipt.jpg', 'image/jpeg');
    expect(storageUrl).toContain('flats-media');
    expect(storageUrl).toContain('test-receipt.jpg');
  });

  it('transcribes voice note using Gemini 1.5 Flash STT fallback when key is not set', async () => {
    const dummyAudio = Buffer.from('fake ogg audio data');
    const transcript = await transcribeVoiceNote(dummyAudio, 'audio/ogg');
    expect(transcript).toBeTruthy();
    expect(typeof transcript).toBe('string');
  });

  it('parses receipt image using Gemini Vision fallback', async () => {
    const dummyImage = Buffer.from('fake receipt image');
    const parsed = await parseReceiptImage(dummyImage, 'image/jpeg');
    expect(parsed).toBeDefined();
    expect(parsed.amount).toBe(45000);
  });

  it('parses meter image using Gemini Vision fallback', async () => {
    const dummyImage = Buffer.from('fake meter image');
    const parsed = await parseMeterImage(dummyImage, 'image/jpeg');
    expect(parsed).toBeDefined();
    expect(parsed.meter_type).toBe('Electricity');
  });

  it('handles voice note forward capture, returns inline keyboard, and creates timeline event on flat assignment', async () => {
    const flat = await db.createFlat({ title: 'Flat 101', address: 'Main St 1', status: 'active' });

    // Step 1: Voice message sent to webhook
    const voicePayload = {
      update_id: 10,
      message: {
        message_id: 501,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        forward_date: 1700000000,
        voice: { file_id: 'voice_file_abc', duration: 5 },
      },
    };

    const req1 = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(voicePayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);
    expect(body1.media_id).toBeDefined();
    expect(body1.transcript).toBeDefined();

    const mediaId = body1.media_id;

    // Step 2: Anya's mom selects Flat & Category via inline keyboard callback query
    const callbackPayload = {
      update_id: 11,
      callback_query: {
        id: 'cb_voice_1',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 502, chat: { id: 123456 } },
        data: `assign_flat:${flat.id}:Note:${mediaId}`,
      },
    };

    const req2 = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(callbackPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.success).toBe(true);

    // Verify Timeline Event recorded for Flat 101
    const timelineEvents = await db.getTimelineEvents(flat.id);
    expect(timelineEvents.length).toBe(1);
    expect(timelineEvents[0].flat_id).toBe(flat.id);
    expect(timelineEvents[0].event_type).toBe('voice_transcript');
    expect(timelineEvents[0].category).toBe('Note');
    expect(timelineEvents[0].content_text).toContain(body1.transcript);
    expect(timelineEvents[0].media_url).toContain('flats-media');
  });

  it('handles forwarded receipt photo capture, saves to storage, and auto-records payment when assigned category is Rent Receipt', async () => {
    const flat = await db.createFlat({ title: 'Flat 202', address: 'Nevsky 10', status: 'active' });
    const tenancy = await db.createTenancy({
      flat_id: flat.id,
      tenant_name: 'Sergey',
      tenant_contact: '+79110000000',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      rent_amount: 50000,
      deposit_amount: 50000,
      due_day: 5,
      status: 'active',
    });
    const expectedPayment = await db.createExpectedPayment({
      tenancy_id: tenancy.id,
      due_date: '2026-07-05',
      amount: 50000,
      status: 'Overdue',
    });

    // Step 1: Forwarded receipt photo sent to webhook
    const photoPayload = {
      update_id: 20,
      message: {
        message_id: 601,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        forward_from: { id: 987654, first_name: 'Sergey' },
        forward_date: 1700000000,
        photo: [
          { file_id: 'photo_small', width: 100, height: 100 },
          { file_id: 'photo_large', width: 800, height: 800 },
        ],
        caption: 'Rent payment transfer for July',
      },
    };

    const req1 = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(photoPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);
    expect(body1.media_id).toBeDefined();

    const mediaId = body1.media_id;

    // Step 2: Anya's mom selects Flat 202 & Rent Receipt category
    const callbackPayload = {
      update_id: 21,
      callback_query: {
        id: 'cb_receipt_1',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 602, chat: { id: 123456 } },
        data: `assign_flat:${flat.id}:Rent Receipt:${mediaId}`,
      },
    };

    const req2 = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(callbackPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2.success).toBe(true);

    // Verify Timeline Event
    const events = await db.getTimelineEvents(flat.id);
    expect(events.length).toBe(1);
    expect(events[0].event_type).toBe('receipt');
    expect(events[0].category).toBe('Rent Receipt');
    expect(events[0].media_url).toContain('flats-media');

    // Verify Expected Payment updated to Paid with Payment Record
    const updatedPayment = await db.getExpectedPayment(expectedPayment.id);
    expect(updatedPayment?.status).toBe('Paid');

    const records = await db.getPaymentRecords(expectedPayment.id);
    expect(records.length).toBe(1);
    expect(records[0].receipt_url).toContain('flats-media');
  });

  it('handles forwarded utility bill document capture and records Utility timeline event', async () => {
    const flat = await db.createFlat({ title: 'Flat 303', address: 'Sadovaya 15', status: 'active' });

    const docPayload = {
      update_id: 30,
      message: {
        message_id: 701,
        from: { id: 123456, first_name: 'Anya' },
        chat: { id: 123456 },
        forward_from_chat: { id: -100123, title: 'Utility Channel' },
        document: { file_id: 'doc_utility_pdf', file_name: 'utility_bill_july.pdf', mime_type: 'application/pdf' },
      },
    };

    const req1 = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(docPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.media_id).toBeDefined();

    const callbackPayload = {
      update_id: 31,
      callback_query: {
        id: 'cb_doc_1',
        from: { id: 123456, first_name: 'Anya' },
        message: { message_id: 702, chat: { id: 123456 } },
        data: `assign_flat:${flat.id}:Utility:${body1.media_id}`,
      },
    };

    const req2 = new Request('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      body: JSON.stringify(callbackPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(200);

    const events = await db.getTimelineEvents(flat.id);
    expect(events.length).toBe(1);
    expect(events[0].category).toBe('Utility');
    expect(events[0].content_text).toContain('utility_bill_july.pdf');
    expect(events[0].media_url).toContain('flats-media');
  });
});
