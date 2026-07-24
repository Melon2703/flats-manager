import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Flat, Tenancy, ExpectedPayment, PaymentRecord, TimelineEvent, InspectionChecklist } from './types';

let supabaseClient: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
}

// In-Memory fallback store for tests / local execution
let memoryFlats: Flat[] = [];
let memoryTenancies: Tenancy[] = [];
let memoryExpectedPayments: ExpectedPayment[] = [];
let memoryPaymentRecords: PaymentRecord[] = [];
let memoryTimelineEvents: TimelineEvent[] = [];
let memoryInspectionChecklists: InspectionChecklist[] = [];

export const db = {
  async reset() {
    memoryFlats = [];
    memoryTenancies = [];
    memoryExpectedPayments = [];
    memoryPaymentRecords = [];
    memoryTimelineEvents = [];
    memoryInspectionChecklists = [];
  },

  // FLATS
  async getFlats(): Promise<Flat[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('flats').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Flat[];
    }
    return [...memoryFlats];
  },

  async getFlat(id: string): Promise<Flat | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('flats').select('*').eq('id', id).single();
      if (!error && data) return data as Flat;
    }
    return memoryFlats.find((f) => f.id === id) || null;
  },

  async createFlat(flatData: Partial<Flat>): Promise<Flat> {
    const flat: Flat = {
      id: flatData.id || crypto.randomUUID(),
      title: flatData.title || 'Untitled Flat',
      address: flatData.address || '',
      status: flatData.status || 'vacant',
      created_at: flatData.created_at || new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('flats').insert(flat).select().single();
      if (!error && data) return data as Flat;
    }

    memoryFlats.unshift(flat);
    return flat;
  },

  async updateFlat(id: string, updates: Partial<Flat>): Promise<Flat | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('flats').update(updates).eq('id', id).select().single();
      if (!error && data) return data as Flat;
    }

    const index = memoryFlats.findIndex((f) => f.id === id);
    if (index !== -1) {
      memoryFlats[index] = { ...memoryFlats[index], ...updates };
      return memoryFlats[index];
    }
    return null;
  },

  // TENANCIES
  async getTenancies(flatId?: string): Promise<Tenancy[]> {
    if (supabaseClient) {
      let query = supabaseClient.from('tenancies').select('*');
      if (flatId) query = query.eq('flat_id', flatId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) return data as Tenancy[];
    }

    let results = [...memoryTenancies];
    if (flatId) {
      results = results.filter((t) => t.flat_id === flatId);
    }
    return results;
  },

  async getTenancy(id: string): Promise<Tenancy | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('tenancies').select('*').eq('id', id).single();
      if (!error && data) return data as Tenancy;
    }
    return memoryTenancies.find((t) => t.id === id) || null;
  },

  async createTenancy(tenancyData: Partial<Tenancy>): Promise<Tenancy> {
    const tenancy: Tenancy = {
      id: tenancyData.id || crypto.randomUUID(),
      flat_id: tenancyData.flat_id!,
      tenant_name: tenancyData.tenant_name || 'Anonymous Tenant',
      tenant_contact: tenancyData.tenant_contact || '',
      start_date: tenancyData.start_date || new Date().toISOString().split('T')[0],
      end_date: tenancyData.end_date || new Date().toISOString().split('T')[0],
      rent_amount: tenancyData.rent_amount || 0,
      deposit_amount: tenancyData.deposit_amount || 0,
      due_day: tenancyData.due_day || 1,
      status: tenancyData.status || 'active',
      created_at: tenancyData.created_at || new Date().toISOString(),
    };

    if (tenancy.status === 'active' && tenancy.flat_id) {
      await this.updateFlat(tenancy.flat_id, { status: 'active' });
    }

    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('tenancies').insert(tenancy).select().single();
      if (!error && data) {
        await this.autoGenerateInitialExpectedPayment(data as Tenancy);
        return data as Tenancy;
      }
    }

    memoryTenancies.unshift(tenancy);
    await this.autoGenerateInitialExpectedPayment(tenancy);
    return tenancy;
  },

  // EXPECTED PAYMENTS
  async autoGenerateInitialExpectedPayment(tenancy: Tenancy): Promise<ExpectedPayment> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(Math.min(tenancy.due_day, 28)).padStart(2, '0');
    const dueDate = `${year}-${month}-${day}`;

    return await this.createExpectedPayment({
      tenancy_id: tenancy.id,
      amount: tenancy.rent_amount,
      due_date: dueDate,
      status: now.getDate() > tenancy.due_day ? 'Overdue' : 'Pending',
    });
  },

  async getExpectedPayments(tenancyId?: string): Promise<ExpectedPayment[]> {
    if (supabaseClient) {
      let query = supabaseClient.from('expected_payments').select('*');
      if (tenancyId) query = query.eq('tenancy_id', tenancyId);
      const { data, error } = await query.order('due_date', { ascending: false });
      if (!error && data) return data as ExpectedPayment[];
    }

    let results = [...memoryExpectedPayments];
    if (tenancyId) {
      results = results.filter((p) => p.tenancy_id === tenancyId);
    }
    return results;
  },

  async getExpectedPayment(id: string): Promise<ExpectedPayment | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('expected_payments').select('*').eq('id', id).single();
      if (!error && data) return data as ExpectedPayment;
    }
    return memoryExpectedPayments.find((p) => p.id === id) || null;
  },

  async createExpectedPayment(data: Partial<ExpectedPayment>): Promise<ExpectedPayment> {
    const payment: ExpectedPayment = {
      id: data.id || crypto.randomUUID(),
      tenancy_id: data.tenancy_id!,
      amount: data.amount || 0,
      due_date: data.due_date || new Date().toISOString().split('T')[0],
      status: data.status || 'Pending',
      created_at: data.created_at || new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from('expected_payments').insert(payment).select().single();
      if (!error && dbData) return dbData as ExpectedPayment;
    }

    memoryExpectedPayments.unshift(payment);
    return payment;
  },

  async updateExpectedPayment(id: string, updates: Partial<ExpectedPayment>): Promise<ExpectedPayment | null> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('expected_payments').update(updates).eq('id', id).select().single();
      if (!error && data) return data as ExpectedPayment;
    }

    const index = memoryExpectedPayments.findIndex((p) => p.id === id);
    if (index !== -1) {
      memoryExpectedPayments[index] = { ...memoryExpectedPayments[index], ...updates };
      return memoryExpectedPayments[index];
    }
    return null;
  },

  // PAYMENT RECORDS
  async createPaymentRecord(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const record: PaymentRecord = {
      id: data.id || crypto.randomUUID(),
      expected_payment_id: data.expected_payment_id!,
      amount: data.amount || 0,
      payment_method: data.payment_method || 'Bank Transfer',
      paid_at: data.paid_at || new Date().toISOString(),
      receipt_url: data.receipt_url || null,
      created_at: data.created_at || new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from('payment_records').insert(record).select().single();
      if (!error && dbData) {
        await this.updateExpectedPayment(record.expected_payment_id, { status: 'Paid' });
        return dbData as PaymentRecord;
      }
    }

    memoryPaymentRecords.unshift(record);
    await this.updateExpectedPayment(record.expected_payment_id, { status: 'Paid' });
    return record;
  },

  // TIMELINE EVENTS
  async getTimelineEvents(flatId: string): Promise<TimelineEvent[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('timeline_events').select('*').eq('flat_id', flatId).order('created_at', { ascending: false });
      if (!error && data) return data as TimelineEvent[];
    }
    return memoryTimelineEvents.filter((e) => e.flat_id === flatId);
  },

  async createTimelineEvent(data: Partial<TimelineEvent>): Promise<TimelineEvent> {
    const event: TimelineEvent = {
      id: data.id || crypto.randomUUID(),
      flat_id: data.flat_id!,
      tenancy_id: data.tenancy_id || null,
      category: data.category || 'general',
      content_text: data.content_text || '',
      media_url: data.media_url || null,
      event_type: data.event_type || 'note',
      created_at: data.created_at || new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from('timeline_events').insert(event).select().single();
      if (!error && dbData) return dbData as TimelineEvent;
    }

    memoryTimelineEvents.unshift(event);
    return event;
  },

  // INSPECTIONS
  async getInspectionChecklists(tenancyId: string): Promise<InspectionChecklist[]> {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('inspection_checklists').select('*').eq('tenancy_id', tenancyId).order('created_at', { ascending: false });
      if (!error && data) return data as InspectionChecklist[];
    }
    return memoryInspectionChecklists.filter((i) => i.tenancy_id === tenancyId);
  },

  async createInspectionChecklist(data: Partial<InspectionChecklist>): Promise<InspectionChecklist> {
    const checklist: InspectionChecklist = {
      id: data.id || crypto.randomUUID(),
      tenancy_id: data.tenancy_id!,
      inspection_type: data.inspection_type || 'move_in',
      items_json: data.items_json || {},
      meter_readings_json: data.meter_readings_json || {},
      created_at: data.created_at || new Date().toISOString(),
    };

    if (supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from('inspection_checklists').insert(checklist).select().single();
      if (!error && dbData) return dbData as InspectionChecklist;
    }

    memoryInspectionChecklists.unshift(checklist);
    return checklist;
  },
};
