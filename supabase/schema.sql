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

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_tenancies_flat_id ON public.tenancies(flat_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_status ON public.tenancies(status);
CREATE INDEX IF NOT EXISTS idx_flats_status ON public.flats(status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;

-- Allow service role full access by default
CREATE POLICY "Service role full access on flats" ON public.flats FOR ALL USING (true);
CREATE POLICY "Service role full access on tenancies" ON public.tenancies FOR ALL USING (true);
