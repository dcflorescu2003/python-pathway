create table if not exists public.apple_oauth_states (
  state text primary key,
  code_verifier text not null,
  return_to text not null,
  created_at timestamptz not null default now()
);

alter table public.apple_oauth_states enable row level security;

create index if not exists apple_oauth_states_created_at_idx
  on public.apple_oauth_states (created_at);