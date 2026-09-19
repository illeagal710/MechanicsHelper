-- Bay ops on a ticket: written estimate, parts ETA, last status (undo),
-- customer symptom photo, owner flag. JSON so older boards still load.
alter table mh_jobs add column if not exists ops_json text not null default '{}';
