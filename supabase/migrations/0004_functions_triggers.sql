-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Update vendor rating on review change ────────────────────────────────────
create or replace function update_vendor_rating()
returns trigger language plpgsql as $$
declare
  v_id uuid;
begin
  v_id := coalesce(new.vendor_id, old.vendor_id);
  update vendors set
    rating = coalesce((
      select avg(rating)::numeric(3,2)
      from reviews
      where vendor_id = v_id and is_visible = true
    ), 0),
    review_count = (
      select count(*)
      from reviews
      where vendor_id = v_id and is_visible = true
    )
  where id = v_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_vendor_rating
  after insert or update or delete on reviews
  for each row execute procedure update_vendor_rating();

-- ─── Auto set updated_at ─────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_vendors_updated_at
  before update on vendors for each row execute procedure set_updated_at();

create trigger trg_orders_updated_at
  before update on orders for each row execute procedure set_updated_at();

create trigger trg_menu_items_updated_at
  before update on menu_items for each row execute procedure set_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles for each row execute procedure set_updated_at();
