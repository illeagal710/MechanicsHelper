-- Mechanics Helper board: shops, accounts, jobs, customer-facing notes.
-- Applied to PGLite in preview and to Postgres on Railway when DATABASE_URL is set.

create table if not exists mh_shops (
  id text primary key,
  name text not null,
  code text not null unique,
  owner_id text not null,
  techs_json text not null default '[]',
  bio text not null default ''
);

create table if not exists mh_users (
  id text primary key,
  name text not null,
  email text not null default '',
  phone text not null default '',
  role text not null,
  pass text not null,
  shop_id text,
  shop_name text,
  shop_role text,
  business_name text,
  service_mode text,
  code text,
  bio text not null default ''
);

create table if not exists mh_jobs (
  id text primary key,
  user_id text,
  created_at bigint not null,
  provider_id text not null,
  provider_type text not null,
  provider_name text not null,
  assigned_to text not null default '',
  name text not null,
  phone text not null default '',
  email text not null default '',
  year text not null default '',
  make text not null default '',
  model text not null default '',
  symptoms text not null default '',
  slot text not null,
  status text not null,
  notes_json text not null default '[]'
);

create index if not exists mh_users_email_idx on mh_users (email);
create index if not exists mh_users_phone_idx on mh_users (phone);
create index if not exists mh_users_code_idx on mh_users (code);
create index if not exists mh_jobs_provider_idx on mh_jobs (provider_id);
create index if not exists mh_jobs_email_idx on mh_jobs (email);
