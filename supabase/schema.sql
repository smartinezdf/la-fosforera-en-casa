create extension if not exists pgcrypto;

do $$ begin
  create type payment_status as enum (
    'pending_reference',
    'reference_submitted',
    'verified',
    'rejected',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum (
    'pending',
    'accepted',
    'preparing',
    'ready',
    'in_delivery',
    'delivered',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists restaurant_settings (
  id integer primary key default 1 check (id = 1),
  usd_to_bs_rate numeric(10, 2) not null default 56.76,
  delivery_usd numeric(10, 2) not null default 2.00,
  payment_mobile_phone text not null default 'Configurar en admin',
  payment_mobile_bank text not null default 'Configurar banco',
  payment_mobile_id text not null default 'Configurar documento',
  restaurant_whatsapp text not null default '00000000000',
  updated_at timestamptz not null default now()
);

create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_usd numeric(10, 2) not null check (price_usd >= 0),
  is_available boolean not null default true,
  is_today boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  location_reference text,
  notes text,
  subtotal_usd numeric(10, 2) not null,
  delivery_usd numeric(10, 2) not null,
  total_usd numeric(10, 2) not null,
  usd_to_bs_rate numeric(10, 2) not null,
  total_bs numeric(12, 2) not null,
  payment_status payment_status not null default 'pending_reference',
  payment_reference text,
  payment_verified_at timestamptz,
  order_status order_status not null default 'pending',
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  dish_id uuid references dishes(id) on delete set null,
  dish_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_usd numeric(10, 2) not null,
  line_total_usd numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists dishes_today_idx on dishes (is_today, sort_order);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (order_status, payment_status);
create index if not exists order_items_order_id_idx on order_items (order_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_dishes_updated_at on dishes;
create trigger set_dishes_updated_at
before update on dishes
for each row execute function set_updated_at();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

drop trigger if exists set_restaurant_settings_updated_at on restaurant_settings;
create trigger set_restaurant_settings_updated_at
before update on restaurant_settings
for each row execute function set_updated_at();

alter table restaurant_settings enable row level security;
alter table dishes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "public can read restaurant settings" on restaurant_settings;
create policy "public can read restaurant settings"
on restaurant_settings for select
to anon, authenticated
using (true);

drop policy if exists "admins manage restaurant settings" on restaurant_settings;
create policy "admins manage restaurant settings"
on restaurant_settings for all
to authenticated
using (true)
with check (true);

drop policy if exists "public can read dishes" on dishes;
create policy "public can read dishes"
on dishes for select
to anon, authenticated
using (true);

drop policy if exists "admins manage dishes" on dishes;
create policy "admins manage dishes"
on dishes for all
to authenticated
using (true)
with check (true);

drop policy if exists "admins read orders" on orders;
create policy "admins read orders"
on orders for select
to authenticated
using (true);

drop policy if exists "admins manage orders" on orders;
create policy "admins manage orders"
on orders for update
to authenticated
using (true)
with check (true);

drop policy if exists "admins read order items" on order_items;
create policy "admins read order items"
on order_items for select
to authenticated
using (true);

insert into restaurant_settings (id, usd_to_bs_rate, delivery_usd, payment_mobile_phone, payment_mobile_bank, payment_mobile_id, restaurant_whatsapp)
values (1, 56.76, 2.00, 'Configurar en admin', 'Configurar banco', 'Configurar documento', '00000000000')
on conflict (id) do nothing;

insert into dishes (name, description, price_usd, is_available, is_today, sort_order)
values
  ('Sopa de res', 'Sopa casera servida caliente, con sabor tradicional.', 5, true, true, 1),
  ('Sopa fosforera', 'Receta de la casa con mariscos, intensa y reconfortante.', 11, true, true, 2),
  ('Rueda de carite', 'Frita, a la plancha o al ajillo.', 11, true, true, 3),
  ('Arroz salteado con mariscos', 'Arroz al punto, salteado con sazón familiar.', 17, true, true, 4),
  ('Camarones al ajillo', 'Camarones al ajillo con el toque de la casa.', 12, true, true, 5),
  ('Pollo con salsa de ajoporro', 'Pollo jugoso con salsa cremosa de ajoporro.', 8, true, true, 6),
  ('Pasta a la boloñesa', 'Pasta con salsa boloñesa casera.', 5, true, true, 7),
  ('Pasta pomodoro con pollo', 'Pasta fresca con pomodoro y pollo a la plancha.', 8, true, true, 8)
on conflict do nothing;
