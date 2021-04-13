create table family (
  id uuid not null primary key default gen_random_uuid(),
  code text not null unique,
  code_created_at timestamptz default now()
);

create index idx_family_code on family(code, code_created_at);

create table family_member (
  family_id uuid,
  user_id uuid,
  primary key(family_id, user_id),
  foreign key (family_id) REFERENCES family(id) ON delete cascade
);
