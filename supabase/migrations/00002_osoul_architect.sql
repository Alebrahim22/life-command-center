-- Osoul Architect OS — market_radar + portfolio_orders

create table market_radar (
  id                  uuid primary key,
  ticker              text not null unique,
  name                text not null,
  price               numeric(18,6) not null,
  fv                  numeric(18,6),
  eps                 numeric(18,6),
  roe                 numeric(10,2),
  yield               numeric(10,2),
  special_flag        text,
  news                text,
  sentiment_applied   boolean not null default false,
  upcoming_dividend   boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_market_radar_updated_at
  before update on market_radar
  for each row execute function set_updated_at();

create table portfolio_orders (
  id          uuid primary key,
  ticker      text not null,
  shares      int not null,
  price       numeric(18,6) not null,
  total       numeric(18,6) not null,
  executed_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index idx_portfolio_orders_date on portfolio_orders (executed_at);

-- Seed market_radar
insert into market_radar (id, ticker, name, price, fv, eps, roe, yield, special_flag, news) values
  (gen_random_uuid(), 'BOURSA',   'Boursa Kuwait',       3.025, null,   0.160, 38.4, 3.5, 'Monopoly',         null),
  (gen_random_uuid(), 'KFH',      'Kuwait Finance House', 0.771, 0.885, null,  18.2, 2.5, null,               null),
  (gen_random_uuid(), 'MEZZ',     'Mezzan Holding',       1.200, 0.722, null,  13.9, 2.1, null,               null),
  (gen_random_uuid(), 'TROLLEY',  'Trolley',              0.920, 0.580, null,  22.0, 0,   null,               null),
  (gen_random_uuid(), 'ALG',      'Ali Alghanim',         0.955, 0.766, null,  25.0, 4.92, null,               null),
  (gen_random_uuid(), 'STC',      'STC Kuwait',           0.664, 0.500, null,  18.0, 6.2, null,               null),
  (gen_random_uuid(), 'BOUBYAN',  'Boubyan Bank',         0.649, 0.610, null,  13.5, 1.8, null,               null),
  (gen_random_uuid(), 'CABLE',    'Gulf Cable',           1.960, 1.820, null,  17.2, 4.1, null,               null),
  (gen_random_uuid(), 'ZAIN',     'Zain Kuwait',          0.603, 0.535, null,  21.5, 6.8, null,               null),
  (gen_random_uuid(), 'OULAFUEL', 'Oula Fuel',            0.225, 0.245, null,  9.2,  3.6, null,               null),
  (gen_random_uuid(), 'JAZEERA',  'Jazeera Airways',      1.610, 1.480, null,  28.1, 5.0, null,               null),
  (gen_random_uuid(), 'CGC',      'Combined Group',       0.928, 0.550, null,  16.0, 4.5, null,               'Pipeline Execution'),
  (gen_random_uuid(), 'SHIP',     'HEISCO',               0.712, 0.701, null,  15.5, 0,   null,               'SAR 500m Aramco Backlog'),
  (gen_random_uuid(), 'MABANEE',  'Mabanee Co',           0.968, 1.050, null,  12.5, 2.5, null,               null);
