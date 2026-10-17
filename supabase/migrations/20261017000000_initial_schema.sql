create table category (
    category_id bigint generated always as identity primary key,
    user_id     uuid not null references auth.users (id) on delete cascade,
    name        text not null,
    keywords    text[] not null default '{}',
    unique (user_id, name)
);

create table store (
    store_id bigint generated always as identity primary key,
    chain text not null,
    branch text not null,
    unique (chain, branch)
);

create table receipt (
    receipt_id bigint generated always as identity primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    store_id bigint not null references store (store_id),
    purchased_at timestamptz not null,
    long_receipt_id text,
    total integer not null,
    savings integer not null default 0,
    unique (user_id, long_receipt_id)
);

create table store_item (
    store_item_id bigint generated always as identity primary key,
    category_id bigint references category (category_id) on delete set null,
    user_id uuid not null references auth.users (id) on delete cascade,
    chain text not null,
    name text not null,
    size numeric,
    unit text,
    unique (user_id, chain, name)
);

create table receipt_item (
    receipt_item_id bigint generated always as identity primary key,
    store_item_id bigint not null references store_item (store_item_id),
    receipt_id bigint not null references receipt (receipt_id) on delete cascade,
    quantity numeric not null check (quantity > 0),
    unit_price integer not null
);