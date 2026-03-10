-- ─── Universities ────────────────────────────────────────────────────────────
create table universities (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  domain     text,
  logo_url   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Profiles (extends auth.users) ───────────────────────────────────────────
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  university_id   uuid references universities(id),
  role            text not null default 'user'
                  check (role in ('admin', 'vendor', 'user')),
  full_name       text,
  phone           text,
  avatar_url      text,
  loyalty_points  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Vendors ─────────────────────────────────────────────────────────────────
create table vendors (
  id              uuid primary key default uuid_generate_v4(),
  university_id   uuid not null references universities(id),
  owner_id        uuid references profiles(id),
  name            text not null,
  slug            text not null unique,
  description     text,
  logo_url        text,
  banner_url      text,
  category        text not null default 'other',
  location_text   text,
  phone           text,
  avg_prep_time   integer not null default 15,
  min_order       numeric(10,2) not null default 0,
  is_approved     boolean not null default false,
  is_active       boolean not null default true,
  opens_at        time,
  closes_at       time,
  rating          numeric(3,2) not null default 0,
  review_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Menus ───────────────────────────────────────────────────────────────────
create table menus (
  id         uuid primary key default uuid_generate_v4(),
  vendor_id  uuid not null references vendors(id) on delete cascade,
  name       text not null default 'Main Menu',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Menu Item Categories ────────────────────────────────────────────────────
create table menu_item_categories (
  id         uuid primary key default uuid_generate_v4(),
  vendor_id  uuid not null references vendors(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0
);

-- ─── Menu Items ───────────────────────────────────────────────────────────────
create table menu_items (
  id           uuid primary key default uuid_generate_v4(),
  menu_id      uuid not null references menus(id) on delete cascade,
  vendor_id    uuid not null references vendors(id),
  category_id  uuid references menu_item_categories(id) on delete set null,
  name         text not null,
  description  text,
  price        numeric(10,2) not null,
  image_url    text,
  is_available boolean not null default true,
  is_featured  boolean not null default false,
  prep_time    integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table orders (
  id                   uuid primary key default uuid_generate_v4(),
  university_id        uuid not null references universities(id),
  vendor_id            uuid not null references vendors(id),
  user_id              uuid references profiles(id),
  customer_name        text not null,
  customer_email       text not null,
  customer_phone       text,
  paystack_reference   text unique,
  paystack_access_code text,
  payment_status       text not null default 'pending'
                       check (payment_status in ('pending','paid','failed','refunded')),
  amount_kobo          bigint not null,
  status               text not null default 'awaiting_payment'
                       check (status in (
                         'awaiting_payment','confirmed','preparing',
                         'ready','completed','cancelled'
                       )),
  pickup_time          timestamptz,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── Order Items ─────────────────────────────────────────────────────────────
create table order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  item_name    text not null,
  item_price   numeric(10,2) not null,
  quantity     integer not null check (quantity > 0),
  subtotal     numeric(10,2) generated always as (item_price * quantity) stored,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ─── Reviews ─────────────────────────────────────────────────────────────────
create table reviews (
  id         uuid primary key default uuid_generate_v4(),
  vendor_id  uuid not null references vendors(id) on delete cascade,
  order_id   uuid not null references orders(id),
  user_id    uuid not null references profiles(id),
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (order_id, user_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index idx_vendors_university  on vendors(university_id);
create index idx_vendors_category    on vendors(category);
create index idx_vendors_slug        on vendors(slug);
create index idx_vendors_search      on vendors using gin(name gin_trgm_ops);
create index idx_vendors_approved    on vendors(is_approved, is_active);

create index idx_menu_items_vendor    on menu_items(vendor_id);
create index idx_menu_items_available on menu_items(vendor_id, is_available);
create index idx_menu_items_menu      on menu_items(menu_id);

create index idx_orders_vendor     on orders(vendor_id);
create index idx_orders_user       on orders(user_id);
create index idx_orders_reference  on orders(paystack_reference);
create index idx_orders_status     on orders(vendor_id, status);
create index idx_orders_university on orders(university_id);

create index idx_order_items_order on order_items(order_id);
create index idx_reviews_vendor    on reviews(vendor_id);
