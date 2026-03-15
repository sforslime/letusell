create table vendor_follows (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  vendor_id  uuid not null references vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vendor_id)
);

alter table vendor_follows enable row level security;

create policy "user_manage_own_follows" on vendor_follows
  for all using (auth.uid() = user_id);

create policy "public_read_follows" on vendor_follows
  for select using (true);
