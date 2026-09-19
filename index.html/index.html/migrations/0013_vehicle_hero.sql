-- Ticket vehicle hero (customer car photo) and paint color.
-- Distinct from mh_jobs.photo, which is the bay / work slot.
alter table mh_jobs add column if not exists vehicle_photo text not null default '';
alter table mh_jobs add column if not exists color text not null default '';
