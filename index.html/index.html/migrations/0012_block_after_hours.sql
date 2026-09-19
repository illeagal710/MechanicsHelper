-- Owner-controlled job length: a booked start also blocks later open slots
-- on the same bay/provider for this many hours. Default 3 so solo shops
-- do not overbook by accident. 0 = Off (exact start only).
alter table mh_shops add column if not exists block_after_hours integer not null default 3;
alter table mh_users add column if not exists block_after_hours integer not null default 3;
