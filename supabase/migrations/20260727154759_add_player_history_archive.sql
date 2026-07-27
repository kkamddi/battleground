create table public.tracked_players (
  platform text not null check (platform in ('steam', 'kakao')),
  account_id text not null,
  player_name text not null,
  tracking_status text not null default 'active'
    check (tracking_status in ('active', 'inactive')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_searched_at timestamptz not null default now(),
  refresh_until timestamptz not null default (now() + interval '30 days'),
  primary key (platform, account_id)
);

create table public.player_season_stats (
  platform text not null,
  account_id text not null,
  season_id text not null,
  ranked_modes jsonb not null default '{}'::jsonb,
  season_modes jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (platform, account_id, season_id),
  foreign key (platform, account_id)
    references public.tracked_players(platform, account_id)
    on delete cascade
);

create table public.player_match_history (
  platform text not null,
  account_id text not null,
  match_id text not null,
  played_at timestamptz not null,
  game_mode text not null,
  map_name text not null,
  kills integer not null default 0,
  damage numeric(12, 3) not null default 0,
  placement integer not null default 0,
  survival_seconds integer not null default 0,
  assists integer not null default 0,
  boosts integer not null default 0,
  dbnos integer not null default 0,
  headshot_kills integer not null default 0,
  heals integer not null default 0,
  longest_kill numeric(12, 3) not null default 0,
  revives integer not null default 0,
  ride_distance numeric(14, 3) not null default 0,
  walk_distance numeric(14, 3) not null default 0,
  captured_at timestamptz not null default now(),
  primary key (platform, account_id, match_id),
  foreign key (platform, account_id)
    references public.tracked_players(platform, account_id)
    on delete cascade
);

create table public.player_report_snapshots (
  snapshot_date date not null,
  platform text not null,
  account_id text not null,
  weapon_stats jsonb not null default '[]'::jsonb,
  attachment_stats jsonb not null default '[]'::jsonb,
  kill_loadout_stats jsonb not null default '[]'::jsonb,
  recent_match_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (snapshot_date, platform, account_id),
  foreign key (platform, account_id)
    references public.tracked_players(platform, account_id)
    on delete cascade
);

create index tracked_players_name_idx
  on public.tracked_players (platform, lower(player_name));
create index tracked_players_refresh_idx
  on public.tracked_players (tracking_status, refresh_until);
create index player_match_history_lookup_idx
  on public.player_match_history (platform, account_id, played_at desc);

alter table public.tracked_players enable row level security;
alter table public.player_season_stats enable row level security;
alter table public.player_match_history enable row level security;
alter table public.player_report_snapshots enable row level security;

revoke all on table
  public.tracked_players,
  public.player_season_stats,
  public.player_match_history,
  public.player_report_snapshots
from anon, authenticated;

grant select, insert, update on table
  public.tracked_players,
  public.player_season_stats,
  public.player_match_history,
  public.player_report_snapshots
to service_role;
