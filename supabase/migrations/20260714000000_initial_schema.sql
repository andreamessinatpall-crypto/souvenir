-- Schema speculare a Dexie/IndexedDB per l'app Souvenir Cefalù.
-- Applicazione mono-utente: RLS richiede solo un utente autenticato,
-- non esiste un concetto di "proprietario" per riga dato che c'è un solo account.

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefono text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  prezzo numeric(10, 2) not null,
  quantita integer not null default 0,
  soglia_minima integer not null default 3,
  foto text,
  fornitore_id uuid references suppliers (id) on delete set null,
  costo_acquisto numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  data timestamptz not null,
  totale numeric(10, 2) not null,
  metodo_pagamento text not null check (metodo_pagamento in ('contanti', 'carta')),
  created_at timestamptz not null default now()
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  nome_prodotto text not null,
  quantita integer not null,
  prezzo_unitario numeric(10, 2) not null
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  fornitore_id uuid not null references suppliers (id) on delete cascade,
  data timestamptz not null,
  stato text not null check (stato in ('in_attesa', 'ricevuto')),
  totale_costo numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  nome_prodotto text not null,
  quantita integer not null,
  costo_unitario numeric(10, 2) not null
);

create index sale_items_sale_id_idx on sale_items (sale_id);
create index order_items_order_id_idx on order_items (order_id);
create index products_fornitore_id_idx on products (fornitore_id);
create index orders_fornitore_id_idx on orders (fornitore_id);

alter table suppliers enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "authenticated full access" on suppliers for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on sales for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on sale_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on orders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on order_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
