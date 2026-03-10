-- Enable RLS on all tables
alter table universities         enable row level security;
alter table profiles             enable row level security;
alter table vendors              enable row level security;
alter table menus                enable row level security;
alter table menu_item_categories enable row level security;
alter table menu_items           enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table reviews              enable row level security;

-- Helper: check if current user has a given role
create or replace function is_role(r text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = r
  )
$$;

-- ─── Universities ─────────────────────────────────────────────────────────────
create policy "public_read_universities" on universities
  for select using (is_active = true);

create policy "admin_manage_universities" on universities
  for all using (is_role('admin'));

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create policy "user_own_profile" on profiles
  for all using (auth.uid() = id);

create policy "admin_read_profiles" on profiles
  for select using (is_role('admin'));

-- ─── Vendors ──────────────────────────────────────────────────────────────────
create policy "public_read_vendors" on vendors
  for select using (is_approved = true and is_active = true);

create policy "vendor_owner_manage" on vendors
  for all using (owner_id = auth.uid());

create policy "admin_all_vendors" on vendors
  for all using (is_role('admin'));

-- ─── Menus ────────────────────────────────────────────────────────────────────
create policy "public_read_menus" on menus
  for select using (
    is_active = true and
    exists (select 1 from vendors where id = menus.vendor_id and is_approved = true and is_active = true)
  );

create policy "vendor_manage_menus" on menus
  for all using (
    exists (select 1 from vendors where id = menus.vendor_id and owner_id = auth.uid())
  );

create policy "admin_all_menus" on menus
  for all using (is_role('admin'));

-- ─── Menu Item Categories ─────────────────────────────────────────────────────
create policy "public_read_categories" on menu_item_categories
  for select using (
    exists (select 1 from vendors where id = menu_item_categories.vendor_id and is_approved = true)
  );

create policy "vendor_manage_categories" on menu_item_categories
  for all using (
    exists (select 1 from vendors where id = menu_item_categories.vendor_id and owner_id = auth.uid())
  );

create policy "admin_all_categories" on menu_item_categories
  for all using (is_role('admin'));

-- ─── Menu Items ───────────────────────────────────────────────────────────────
create policy "public_read_menu_items" on menu_items
  for select using (
    is_available = true and
    exists (select 1 from vendors where id = menu_items.vendor_id and is_approved = true and is_active = true)
  );

-- Vendors can see all their own items (including unavailable)
create policy "vendor_manage_menu_items" on menu_items
  for all using (
    exists (select 1 from vendors where id = menu_items.vendor_id and owner_id = auth.uid())
  );

create policy "admin_all_menu_items" on menu_items
  for all using (is_role('admin'));

-- ─── Orders ───────────────────────────────────────────────────────────────────
create policy "user_own_orders" on orders
  for select using (user_id = auth.uid());

create policy "vendor_see_orders" on orders
  for select using (
    exists (select 1 from vendors where id = orders.vendor_id and owner_id = auth.uid())
  );

create policy "vendor_update_order_status" on orders
  for update using (
    exists (select 1 from vendors where id = orders.vendor_id and owner_id = auth.uid())
  )
  with check (
    status in ('preparing', 'ready', 'completed', 'cancelled')
  );

create policy "admin_all_orders" on orders
  for all using (is_role('admin'));

-- ─── Order Items ──────────────────────────────────────────────────────────────
create policy "user_own_order_items" on order_items
  for select using (
    exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid())
  );

create policy "vendor_see_order_items" on order_items
  for select using (
    exists (
      select 1 from orders o
      join vendors v on v.id = o.vendor_id
      where o.id = order_items.order_id and v.owner_id = auth.uid()
    )
  );

create policy "admin_all_order_items" on order_items
  for all using (is_role('admin'));

-- ─── Reviews ──────────────────────────────────────────────────────────────────
create policy "public_read_reviews" on reviews
  for select using (is_visible = true);

create policy "user_create_review" on reviews
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from orders where id = reviews.order_id and user_id = auth.uid() and status = 'completed')
  );

create policy "user_own_review" on reviews
  for update using (user_id = auth.uid());

create policy "admin_all_reviews" on reviews
  for all using (is_role('admin'));
