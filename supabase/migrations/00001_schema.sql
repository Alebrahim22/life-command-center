-- Life Command Center — Supabase PostgreSQL Migration
-- Run in order. Each table includes created_at / updated_at triggers.

-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key,
  current_tab   text not null default 'today',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. shifts
-- ---------------------------------------------------------------------------
create table shifts (
  id                  uuid primary key,
  date                date not null,
  type                text not null check (type in ('work', 'sick', 'excused', 'allowance')),
  allowance_hours     int not null default 0,  -- meaningful only when type = 'allowance'
  created_at          timestamptz not null default now()
);

create index idx_shifts_date on shifts (date);
create index idx_shifts_type on shifts (type);

-- ---------------------------------------------------------------------------
-- 3. todos
-- ---------------------------------------------------------------------------
create table todos (
  id          uuid primary key,
  text        text not null,
  priority    text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  due_date    date,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_todos_updated_at
  before update on todos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. events
-- ---------------------------------------------------------------------------
create table events (
  id          uuid primary key,
  title       text not null,
  date        date not null,
  time        time,
  category    text not null check (category in ('Personal', 'Work', 'Business', 'Legal', 'Medical')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_events_date on events (date);

create trigger trg_events_updated_at
  before update on events
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. portfolio_platforms
-- ---------------------------------------------------------------------------
create table portfolio_platforms (
  id            uuid primary key,
  name          text not null unique check (name in ('Binance', 'Kuwait Boursa', 'eToro')),
  change_today  numeric(18,4) not null default 0,
  usd_to_kwd    numeric(10,6) not null default 0.307,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into portfolio_platforms (id, name) values
  (gen_random_uuid(), 'Binance'),
  (gen_random_uuid(), 'Kuwait Boursa'),
  (gen_random_uuid(), 'eToro');

create trigger trg_portfolio_platforms_updated_at
  before update on portfolio_platforms
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. portfolio_holdings
-- ---------------------------------------------------------------------------
create table portfolio_holdings (
  id            uuid primary key,
  platform_id   uuid not null references portfolio_platforms(id) on delete cascade,
  asset         text not null,
  quantity      numeric(18,6) not null,
  buy_price     numeric(18,6) not null,
  current_price numeric(18,6) not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_holdings_platform on portfolio_holdings (platform_id);

create trigger trg_portfolio_holdings_updated_at
  before update on portfolio_holdings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. bills
-- ---------------------------------------------------------------------------
create table bills (
  id          uuid primary key,
  name        text not null,
  amount      numeric(14,4) not null,
  currency    text not null default 'KWD' check (currency in ('KWD', 'USD')),
  due_day     int not null check (due_day between 1 and 31),
  category    text not null check (category in ('Utility', 'Subscription', 'Insurance', 'Loan', 'Other')),
  auto_renews boolean not null default true,
  usd_to_kwd  numeric(10,6) not null default 0.307,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_bills_updated_at
  before update on bills
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. bill_payments
-- ---------------------------------------------------------------------------
create table bill_payments (
  id        uuid primary key,
  bill_id   uuid not null references bills(id) on delete cascade,
  month_key text not null,  -- format: 'YYYY-MM'
  paid_at   timestamptz not null default now()
);

create index idx_bill_payments_bill  on bill_payments (bill_id);
create index idx_bill_payments_month on bill_payments (month_key);
create unique index idx_bill_payments_unique on bill_payments (bill_id, month_key);

-- ---------------------------------------------------------------------------
-- 9. budget
-- ---------------------------------------------------------------------------
create table budget (
  id                  uuid primary key,
  month_key           text not null,  -- format: 'YYYY-MM'
  income              numeric(14,4) not null default 0,
  savings_goal_percent int not null default 20 check (savings_goal_percent between 0 and 100),
  housing             numeric(14,4) not null default 0,
  food                numeric(14,4) not null default 0,
  transport           numeric(14,4) not null default 0,
  subscriptions       numeric(14,4) not null default 0,
  business_expenses   numeric(14,4) not null default 0,
  personal            numeric(14,4) not null default 0,
  other               numeric(14,4) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index idx_budget_month on budget (month_key);

create trigger trg_budget_updated_at
  before update on budget
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. projects
-- ---------------------------------------------------------------------------
create table projects (
  id          uuid primary key,
  name        text not null unique check (name in ('Hadeya', 'Reluxx', 'Osoul', 'XYZ Agency', 'Personal Brand')),
  status      text not null default 'Active' check (status in ('Active', 'On Hold', 'Launched', 'Archived')),
  stage       text not null default 'Idea' check (stage in ('Idea', 'Building', 'Beta', 'Live', 'Scaling')),
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

insert into projects (id, name) values
  (gen_random_uuid(), 'Hadeya'),
  (gen_random_uuid(), 'Reluxx'),
  (gen_random_uuid(), 'Osoul'),
  (gen_random_uuid(), 'XYZ Agency'),
  (gen_random_uuid(), 'Personal Brand');

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. project_kpis
-- ---------------------------------------------------------------------------
create table project_kpis (
  id            uuid primary key,
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  current_value numeric(14,4) not null default 0,
  target_value  numeric(14,4) not null default 0,
  unit          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_kpis_project on project_kpis (project_id);

create trigger trg_project_kpis_updated_at
  before update on project_kpis
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. project_milestones
-- ---------------------------------------------------------------------------
create table project_milestones (
  id          uuid primary key,
  project_id  uuid not null references projects(id) on delete cascade,
  title       text not null,
  due_date    date not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_milestones_project on project_milestones (project_id);

create trigger trg_project_milestones_updated_at
  before update on project_milestones
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 13. legal_cases
-- ---------------------------------------------------------------------------
create table legal_cases (
  id                uuid primary key,
  case_number       text not null,
  title             text not null,
  role              text not null check (role in ('Plaintiff', 'Defendant')),
  court             text not null,
  stage             text not null default 'Filed' check (stage in ('Filed', 'Under Review', 'Hearing Scheduled', 'Awaiting Judgment', 'Appealed', 'Closed', 'Won', 'Lost')),
  next_session_date date,
  next_session_time time,
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_legal_cases_updated_at
  before update on legal_cases
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 14. legal_case_logs
-- ---------------------------------------------------------------------------
create table legal_case_logs (
  id        uuid primary key,
  case_id   uuid not null references legal_cases(id) on delete cascade,
  log_date  date not null default current_date,
  log_text  text not null,
  created_at timestamptz not null default now()
);

create index idx_case_logs_case on legal_case_logs (case_id);
create index idx_case_logs_date on legal_case_logs (log_date);

-- ---------------------------------------------------------------------------
-- 15. trading_journal
-- ---------------------------------------------------------------------------
create table trading_journal (
  id                uuid primary key,
  instrument        text not null check (instrument in ('XAU/USD', 'EUR/USD', 'GBP/USD', 'Custom')),
  instrument_custom text not null default '',
  direction         text not null check (direction in ('Long', 'Short')),
  entry_price       numeric(18,6) not null,
  exit_price        numeric(18,6),
  lot_size          numeric(14,4) not null,
  stop_loss         numeric(18,6) not null,
  take_profit       numeric(18,6) not null,
  status            text not null check (status in ('Open', 'Closed', 'Stopped Out')),
  date_opened       date not null default current_date,
  date_closed       date,
  strategy          text not null default 'Manual' check (strategy in ('Inside Bar', 'EMA Ribbon', 'Manual', 'Other')),
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_trades_status on trading_journal (status);
create index idx_trades_date  on trading_journal (date_opened);

create trigger trg_trading_journal_updated_at
  before update on trading_journal
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 16. habits
-- ---------------------------------------------------------------------------
create table habits (
  id        uuid primary key,
  date_key  date not null,
  habit_id  text not null check (habit_id in (
    'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
    'morning-routine', 'exercise', 'read', 'no-junk-food', 'cold-shower'
  )),
  created_at timestamptz not null default now()
);

create unique index idx_habits_unique on habits (date_key, habit_id);
create index idx_habits_date on habits (date_key);
