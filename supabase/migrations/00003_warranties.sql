-- Warranty & Service Agreement Tracker

create table warranties (
  id                uuid primary key,
  item_name         text not null,
  provider          text not null,
  purchase_date     date not null,
  expiration_date   date not null,
  purchase_cost     numeric(14,4),
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_warranties_expiration on warranties (expiration_date);

create trigger trg_warranties_updated_at
  before update on warranties
  for each row execute function set_updated_at();
