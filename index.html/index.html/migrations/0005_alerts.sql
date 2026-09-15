alter table mh_jobs add column if not exists notify_sms boolean not null default true;
alter table mh_users add column if not exists push_token text not null default '';
alter table mh_users add column if not exists alerts_on boolean not null default true;
