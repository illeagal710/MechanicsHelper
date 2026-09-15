alter table mh_shops add column if not exists support_email text not null default '';
alter table mh_shops add column if not exists support_phone text not null default '';
alter table mh_users add column if not exists support_email text not null default '';
alter table mh_users add column if not exists support_phone text not null default '';
