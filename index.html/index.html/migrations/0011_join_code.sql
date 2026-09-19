-- Employee team-join is a different code from the customer find/referral code.
-- `mh_shops.code` stays the public find code. `join_code` is owner-only for staff.
alter table mh_shops add column if not exists join_code text;
create unique index if not exists mh_shops_join_code_idx on mh_shops (join_code) where join_code is not null;
