-- Users (restaurant owners / admins later)
create table if not exists app_user (
  id bigserial primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'owner', -- 'owner' | 'admin'
  created_at timestamptz not null default now()
);

-- Restaurants
create table if not exists restaurant (
  id bigserial primary key,
  owner_id bigint not null references app_user(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  province text not null default 'ON',
  postal_code text,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website_url text,
  price_range text, -- $, $$, $$$
  cuisine_tags text[] not null default '{}',
  rating real,
  reviews_count integer not null default 0,
  pickup_only boolean not null default true,
  hours_json jsonb, -- optional hours blob
  created_at timestamptz not null default now(),
  unique(name, address)
);

create index if not exists idx_restaurant_city on restaurant(city);
create index if not exists idx_restaurant_lat_lng on restaurant(lat, lng);
create index if not exists idx_restaurant_cuisines on restaurant using gin (cuisine_tags);

-- Deals (daily/rotating)
create table if not exists deal (
  id bigserial primary key,
  restaurant_id bigint not null references restaurant(id) on delete cascade,
  title text not null,
  description text,
  discount_type text not null, -- 'PERCENT' | 'FIXED' | 'BOGO' | 'OTHER'
  discount_value numeric(10,2), -- null for BOGO/OTHER
  start_time time not null default '00:00',
  end_time time not null default '23:59',
  days_of_week smallint[] not null default '{1,2,3,4,5,6,7}', -- 1=Mon..7=Sun
  valid_from date, -- optional start date
  valid_to date,   -- optional end date
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_deal_restaurant on deal(restaurant_id);
create index if not exists idx_deal_active on deal(is_active);
create index if not exists idx_deal_validity on deal(valid_from, valid_to);

-- Orders (MVP placeholder)
create table if not exists app_order (
  id bigserial primary key,
  restaurant_id bigint not null references restaurant(id) on delete restrict,
  deal_id bigint references deal(id) on delete set null,
  customer_email text not null,
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  total_cents integer not null,
  status text not null default 'PLACED', -- PLACED | READY | PICKED_UP | CANCELED
  created_at timestamptz not null default now()
);

create index if not exists idx_order_restaurant_created on app_order(restaurant_id, created_at desc);
