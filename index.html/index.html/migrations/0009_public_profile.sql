-- Public shop / independent trust fields. Text JSON matches techs_json / notes_json.
alter table mh_shops add column if not exists specialties_json text not null default '[]';
alter table mh_shops add column if not exists credentials_json text not null default '[]';
alter table mh_shops add column if not exists service_area text not null default '';
alter table mh_shops add column if not exists years_wrenching text not null default '';
alter table mh_users add column if not exists specialties_json text not null default '[]';
alter table mh_users add column if not exists credentials_json text not null default '[]';
alter table mh_users add column if not exists service_area text not null default '';
alter table mh_users add column if not exists years_wrenching text not null default '';
