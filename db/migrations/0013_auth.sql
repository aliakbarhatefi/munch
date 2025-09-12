create table if not exists owner (
  id bigserial primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists session (
  id bigserial primary key,
  owner_id bigint not null references owner(id) on delete cascade,
  refresh_token_hash text not null,
  user_agent text,
  ip text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists idx_session_owner on session(owner_id);
