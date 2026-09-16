-- One-time codes for forgot-password / forgot-username on mh_users.
-- Applied to PGLite in preview and to Postgres on Railway when DATABASE_URL is set.

create table if not exists mh_recovery (
  id text primary key,
  user_id text not null,
  purpose text not null,
  code_hash text not null,
  expires_at bigint not null,
  used_at bigint
);

create index if not exists mh_recovery_user_idx on mh_recovery (user_id);
create index if not exists mh_recovery_expires_idx on mh_recovery (expires_at);
