create table public.receipts (
  id uuid primary key,
  owner_id uuid not null,
  apartment_id uuid not null,
  rental_month date not null,
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  received_on date not null check (received_on between '2000-01-01' and '2100-12-31'),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now(),
  foreign key (apartment_id, owner_id) references public.apartments(id, owner_id),
  foreign key (apartment_id, rental_month) references public.rent_months(apartment_id, rental_month)
);
create index receipts_month on public.receipts(owner_id, rental_month, apartment_id);
alter table public.receipts enable row level security;
create policy own_receipts on public.receipts for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.receipts from anon, authenticated;
grant select on public.receipts to authenticated;

create function public.record_receipt(p_id uuid, p_apartment_id uuid, p_month date, p_amount_cents bigint, p_received_on date, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare obligation public.rent_months; prior public.receipts; received bigint;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  -- Serialize changes to one obligation, including requests from other tabs.
  select * into obligation from public.rent_months
    where apartment_id = p_apartment_id and rental_month = p_month and owner_id = auth.uid() for update;
  if not found then raise exception 'invalid_obligation'; end if;
  select * into prior from public.receipts where id = p_id;
  if found then
    if prior.owner_id <> auth.uid() or prior.apartment_id <> p_apartment_id or prior.rental_month <> p_month
      or prior.amount_cents <> p_amount_cents or prior.received_on <> p_received_on or prior.note <> p_note
      then raise exception 'submission_conflict'; end if;
    return; -- Exact retries succeed even when the first response was lost.
  end if;
  select coalesce(sum(amount_cents), 0) into received from public.receipts
    where apartment_id = p_apartment_id and rental_month = p_month;
  -- This slice records full/partial settlement only. Never allocate excess elsewhere.
  if p_amount_cents > obligation.expected_cents - received then raise exception 'balance_changed'; end if;
  insert into public.receipts(id, owner_id, apartment_id, rental_month, amount_cents, received_on, note)
    values(p_id, auth.uid(), p_apartment_id, p_month, p_amount_cents, p_received_on, p_note);
end;
$$;
revoke all on function public.record_receipt(uuid, uuid, date, bigint, date, text) from public, anon;
grant execute on function public.record_receipt(uuid, uuid, date, bigint, date, text) to authenticated;

-- One snapshot of all receipts: the Data API's row cap must not truncate money totals.
create function public.monthly_receipts(p_month date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'apartment_id', apartment_id, 'rental_month', rental_month,
    'amount_cents', amount_cents, 'received_on', received_on, 'note', note
  ) order by received_on, created_at, id), '[]'::jsonb)
  from public.receipts where owner_id = auth.uid() and rental_month = p_month;
$$;
revoke all on function public.monthly_receipts(date) from public, anon;
grant execute on function public.monthly_receipts(date) to authenticated;
