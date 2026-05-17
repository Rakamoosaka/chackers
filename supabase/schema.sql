create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'New player',
  city text not null default 'Almaty',
  rating integer not null default 1200,
  league text not null default 'Bronze' check (league in ('Bronze', 'Silver', 'Gold', 'Elite')),
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  puzzle_streak integer not null default 0,
  is_pro boolean not null default false,
  pro_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_pro boolean not null default false;

alter table public.profiles
  add column if not exists pro_started_at timestamptz;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('local', 'ai', 'room')),
  time_control text not null check (time_control in ('bullet', 'blitz', 'rapid')),
  opponent text not null,
  result text not null check (result in ('win', 'loss', 'draw')),
  rating_delta integer not null default 0,
  coach_summary jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.match_moves (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  move_number integer not null,
  player text not null check (player in ('red', 'black')),
  from_square text not null,
  to_square text not null,
  captured jsonb not null default '[]'::jsonb,
  promoted boolean not null default false,
  evaluation_before integer,
  evaluation_after integer
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  display_name text not null,
  city text not null default 'Almaty',
  league text not null default 'Bronze' check (league in ('Bronze', 'Silver', 'Gold', 'Elite')),
  rating integer not null default 1200,
  games_played integer not null default 0,
  seeded boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists leaderboard_entries_profile_id_key
  on public.leaderboard_entries(profile_id)
  where profile_id is not null;

create table if not exists public.puzzle_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  puzzle_key text not null,
  solved_on date not null default current_date,
  attempts integer not null default 1,
  unique (user_id, puzzle_key)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid references public.profiles(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  board_state jsonb not null,
  turn text not null default 'red' check (turn in ('red', 'black')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  seat text not null check (seat in ('red', 'black', 'spectator')),
  display_name text not null,
  joined_at timestamptz not null default now(),
  unique (room_id, seat)
);

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_moves enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.puzzle_progress enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_messages enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

grant select, insert, update on public.matches to authenticated;
grant select, insert on public.match_moves to authenticated;

grant select on public.leaderboard_entries to anon, authenticated;
grant insert, update on public.leaderboard_entries to authenticated;

grant select, insert, update on public.puzzle_progress to authenticated;

grant select on public.rooms to anon, authenticated;
grant insert, update on public.rooms to authenticated;

grant select on public.room_players to anon, authenticated;
grant insert on public.room_players to anon, authenticated;

grant select on public.room_messages to anon, authenticated;
grant insert on public.room_messages to anon, authenticated;

grant usage, select on all sequences in schema public to authenticated;

create policy "profiles are readable" on public.profiles
  for select using (true);

create policy "users update own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users manage own matches" on public.matches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own match moves" on public.match_moves
  for select using (
    exists (
      select 1 from public.matches
      where matches.id = match_moves.match_id
      and matches.user_id = auth.uid()
    )
  );

create policy "users insert own match moves" on public.match_moves
  for insert with check (
    exists (
      select 1 from public.matches
      where matches.id = match_moves.match_id
      and matches.user_id = auth.uid()
    )
  );

create policy "leaderboard is public read" on public.leaderboard_entries
  for select using (true);

create policy "users upsert own leaderboard row" on public.leaderboard_entries
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "users manage own puzzle progress" on public.puzzle_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rooms are readable" on public.rooms
  for select using (true);

create policy "authenticated users create rooms" on public.rooms
  for insert with check (auth.uid() = host_id);

create policy "hosts update rooms" on public.rooms
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "room players update rooms" on public.rooms
  for update using (
    exists (
      select 1 from public.room_players
      where room_players.room_id = rooms.id
      and room_players.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.room_players
      where room_players.room_id = rooms.id
      and room_players.user_id = auth.uid()
    )
  );

create policy "room players are readable" on public.room_players
  for select using (true);

create policy "authenticated users join rooms" on public.room_players
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "room messages are readable" on public.room_messages
  for select using (true);

create policy "authenticated users send room messages" on public.room_messages
  for insert with check (auth.uid() = user_id or user_id is null);
