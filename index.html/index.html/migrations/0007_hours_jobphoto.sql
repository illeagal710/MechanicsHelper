alter table mh_shops add column if not exists hours_days text not null default '123456';
alter table mh_shops add column if not exists hours_open text not null default '08:00';
alter table mh_shops add column if not exists hours_close text not null default '16:00';
alter table mh_users add column if not exists hours_days text not null default '123456';
alter table mh_users add column if not exists hours_open text not null default '08:00';
alter table mh_users add column if not exists hours_close text not null default '16:00';
alter table mh_jobs add column if not exists photo text not null default '';
