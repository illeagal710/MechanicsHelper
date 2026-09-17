-- Customer-visible street address for shops and independents. Powers the
-- "Get directions" link (Google/Apple Maps). Independents may leave it blank.
alter table mh_shops add column if not exists address text not null default '';
alter table mh_users add column if not exists address text not null default '';
