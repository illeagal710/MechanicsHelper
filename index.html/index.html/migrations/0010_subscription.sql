-- Provider billing. Customers stay free; shops and independents run the portal
-- behind a subscription. New providers insert with 'none' (locked until they
-- start a trial or subscribe); providers that predate billing are grandfathered
-- to 'active' so existing portals keep working.
alter table mh_users add column if not exists sub_status text not null default 'none';
alter table mh_users add column if not exists trial_ends_at bigint;
alter table mh_users add column if not exists sub_renews_at bigint;
update mh_users set sub_status = 'active'
  where role in ('shop', 'independent') and sub_status = 'none';
