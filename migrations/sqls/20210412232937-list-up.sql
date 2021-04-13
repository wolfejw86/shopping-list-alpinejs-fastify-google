create table list(
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null
);

create table list_item(
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null,
  content text not null,
  foreign key (list_id) REFERENCES list(id)
);