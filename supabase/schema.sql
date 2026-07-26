-- Database Schema Definition for Flats & Tenancies Management Slice
-- Target Database: Supabase / PostgreSQL

-- 1. Flats Table
CREATE TABLE IF NOT EXISTS public.flats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('active', 'vacant', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenancies Table
CREATE TABLE IF NOT EXISTS public.tenancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES public.flats(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_contact TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC(12, 2) NOT NULL CHECK (rent_amount >= 0),
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Expected Payments Table
CREATE TABLE IF NOT EXISTS public.expected_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES public.tenancies(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Due Today', 'Overdue', 'Paid', 'Partial', 'Waived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Payment Records Table
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expected_payment_id UUID NOT NULL REFERENCES public.expected_payments(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Timeline Events Table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flat_id UUID NOT NULL REFERENCES public.flats(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES public.tenancies(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content_text TEXT NOT NULL,
  media_url TEXT,
  event_type TEXT NOT NULL DEFAULT 'note' CHECK (event_type IN ('receipt', 'voice_transcript', 'note', 'inspection', 'payment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Inspection Checklists Table
CREATE TABLE IF NOT EXISTS public.inspection_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES public.tenancies(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('move_in', 'move_out')),
  items_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  meter_readings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenancies_flat_id ON public.tenancies(flat_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_status ON public.tenancies(status);
CREATE INDEX IF NOT EXISTS idx_flats_status ON public.flats(status);
CREATE INDEX IF NOT EXISTS idx_expected_payments_tenancy_id ON public.expected_payments(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_expected_payments_due_date ON public.expected_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_expected_payments_status ON public.expected_payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_expected_payment_id ON public.payment_records(expected_payment_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_flat_id ON public.timeline_events(flat_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_tenancy_id ON public.timeline_events(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_inspection_checklists_tenancy_id ON public.inspection_checklists(tenancy_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;

-- Allow service role full access by default
CREATE POLICY "Service role full access on flats" ON public.flats FOR ALL USING (true);
CREATE POLICY "Service role full access on tenancies" ON public.tenancies FOR ALL USING (true);
CREATE POLICY "Service role full access on expected_payments" ON public.expected_payments FOR ALL USING (true);
CREATE POLICY "Service role full access on payment_records" ON public.payment_records FOR ALL USING (true);
CREATE POLICY "Service role full access on timeline_events" ON public.timeline_events FOR ALL USING (true);
CREATE POLICY "Service role full access on inspection_checklists" ON public.inspection_checklists FOR ALL USING (true);

-- 9. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'en')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on user_settings" ON public.user_settings FOR ALL USING (true);


