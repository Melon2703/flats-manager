-- Amounts are exact USD cents, safely representable by JavaScript integers.
create table public.apartments (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) between 1 and 120),
  rent_cents bigint not null check (rent_cents between 1 and 99999999999),
  due_day smallint not null check (due_day between 1 and 28),
  start_month date not null check (extract(day from start_month) = 1),
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.rent_months (
  apartment_id uuid not null,
  owner_id uuid not null,
  rental_month date not null check (extract(day from rental_month) = 1),
  expected_cents bigint not null check (expected_cents between 1 and 99999999999),
  due_date date not null,
  primary key (apartment_id, rental_month),
  foreign key (apartment_id, owner_id) references public.apartments(id, owner_id)
);

alter table public.apartments enable row level security;
alter table public.rent_months enable row level security;
create policy own_apartments on public.apartments for select to authenticated using (owner_id = (select auth.uid()));
create policy own_rent_months on public.rent_months for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.apartments, public.rent_months from anon, authenticated;
grant select on public.apartments, public.rent_months to authenticated;

create function public.add_apartment(p_id uuid, p_name text, p_rent_cents bigint, p_due_day smallint, p_month date)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if p_month < '2000-01-01' or p_month > '2100-12-01' then raise exception 'invalid_month'; end if;
  insert into public.apartments(id, owner_id, name, rent_cents, due_day, start_month)
    values(p_id, auth.uid(), trim(p_name), p_rent_cents, p_due_day, p_month)
    on conflict (id) do nothing;
  if not exists (select 1 from public.apartments where id = p_id and owner_id = auth.uid()
    and name = trim(p_name) and rent_cents = p_rent_cents and due_day = p_due_day and start_month = p_month)
    then raise exception 'submission_conflict'; end if;
end;
$$;

-- Snapshot terms once per rental month; later reads never rewrite a snapshot.
-- Days 29-31 are unsupported until short-month behavior is confirmed.
create function public.monthly_rent(p_month date)
returns table(apartment_id uuid, name text, expected_cents bigint, due_date date)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  if p_month is null or extract(day from p_month) <> 1 or p_month < '2000-01-01' or p_month > '2100-12-01'
    then raise exception 'invalid_month'; end if;
  insert into public.rent_months(apartment_id, owner_id, rental_month, expected_cents, due_date)
    select a.id, a.owner_id, p_month, a.rent_cents,
      p_month + (a.due_day::integer - 1)
    from public.apartments a where a.owner_id = auth.uid() and a.start_month <= p_month
    on conflict do nothing;
  return query select a.id, a.name, m.expected_cents, m.due_date
    from public.apartments a join public.rent_months m on m.apartment_id = a.id
    where a.owner_id = auth.uid() and m.rental_month = p_month order by a.created_at, a.id;
end;
$$;

revoke all on function public.add_apartment(uuid, text, bigint, smallint, date), public.monthly_rent(date) from public, anon;
grant execute on function public.add_apartment(uuid, text, bigint, smallint, date), public.monthly_rent(date) to authenticated;
