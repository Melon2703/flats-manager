export type FlatStatus = 'active' | 'vacant' | 'maintenance';

export type TenancyStatus = 'active' | 'ended';

export type PaymentStatus = 'Pending' | 'Due Today' | 'Overdue' | 'Paid' | 'Partial' | 'Waived';

export type PaymentMethod = 'Cash' | 'Bank Transfer';

export type EventType = 'receipt' | 'voice_transcript' | 'note' | 'inspection' | 'payment';

export interface Flat {
  id: string;
  title: string;
  address: string;
  status: FlatStatus;
  created_at: string;
}

export interface Tenancy {
  id: string;
  flat_id: string;
  tenant_name: string;
  tenant_contact: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  due_day: number; // 1 - 31
  status: TenancyStatus;
  created_at: string;
}

export interface ExpectedPayment {
  id: string;
  tenancy_id: string;
  due_date: string; // YYYY-MM-DD
  amount: number;
  status: PaymentStatus;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  expected_payment_id: string;
  amount: number;
  payment_method: PaymentMethod;
  paid_at: string;
  receipt_url?: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  flat_id: string;
  tenancy_id?: string | null;
  category: string; // e.g. 'payment', 'maintenance', 'inspection', 'voice_note', 'general'
  content_text: string;
  media_url?: string | null;
  event_type: EventType;
  created_at: string;
}

export interface InspectionChecklist {
  id: string;
  tenancy_id: string;
  inspection_type: 'move_in' | 'move_out';
  items_json: Record<string, any>;
  meter_readings_json: Record<string, any>;
  created_at: string;
}

export interface SettlementDeductions {
  unpaid_rent: number;
  utilities: number;
  cleaning: number;
  damages: number;
}

export interface SettlementSummary {
  deposit_amount: number;
  deductions: SettlementDeductions;
  refund_amount: number;
  itemized_breakdown: Array<{
    category: string;
    description: string;
    amount: number;
    photo_urls?: string[];
  }>;
}
