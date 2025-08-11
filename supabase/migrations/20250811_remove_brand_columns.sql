begin;
alter table if exists strategies drop column if exists brand;
alter table if exists ideas drop column if exists brand;
commit;
