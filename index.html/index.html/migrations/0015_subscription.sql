-- Provider billing on the existing mh_users row.
-- Shop owners and independents pay. Customers stay free (role customer is
-- untouched). Technicians are role shop too, but the app reads the owner's
-- row — a tech does not get a separate plan.
--
-- 0010_address.sql already owns number 0010. This is the next free number.
--
-- New signups keep the column default 'none' (locked) because this update
-- runs once, at migrate time. Rows that already exist — live shops,
-- independents, and reviewer accounts — are grandfathered to 'active' with
-- no renewal timestamp, so they are not locked and do not expire.
-- Seeded demo shop/independent are comped in ensureSeeded.

alter table mh_users add column if not exists sub_status text not null default 'none';
alter table mh_users add column if not exists trial_ends_at bigint;
alter table mh_users add column if not exists sub_renews_at bigint;

update mh_users set sub_status = 'active'
  where role in ('shop', 'independent') and sub_status = 'none';
