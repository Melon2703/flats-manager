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

-- 5. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenancies_flat_id ON public.tenancies(flat_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_status ON public.tenancies(status);
CREATE INDEX IF NOT EXISTS idx_flats_status ON public.flats(status);
CREATE INDEX IF NOT EXISTS idx_expected_payments_tenancy_id ON public.expected_payments(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_expected_payments_due_date ON public.expected_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_expected_payments_status ON public.expected_payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_expected_payment_id ON public.payment_records(expected_payment_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Allow service role full access by default
CREATE POLICY "Service role full access on flats" ON public.flats FOR ALL USING (true);
CREATE POLICY "Service role full access on tenancies" ON public.tenancies FOR ALL USING (true);
CREATE POLICY "Service role full access on expected_payments" ON public.expected_payments FOR ALL USING (true);
CREATE POLICY "Service role full access on payment_records" ON public.payment_records FOR ALL USING (true);

