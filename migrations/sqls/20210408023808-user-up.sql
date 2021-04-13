create table users (
  id uuid not null default gen_random_uuid(),
  provider_id text not null unique,
  provider_type text not null
);

CREATE UNIQUE INDEX idxu_users_provider ON users(provider_id, provider_type);