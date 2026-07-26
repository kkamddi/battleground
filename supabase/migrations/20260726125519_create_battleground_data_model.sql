create table public.patch_versions (
  id bigint generated always as identity primary key,
  version text not null unique,
  title text not null,
  source_url text not null unique,
  published_at timestamptz,
  pc_applied_at timestamptz,
  console_applied_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patch_candidates (
  id bigint generated always as identity primary key,
  source_url text not null,
  source_hash text not null,
  title text not null,
  detected_version text,
  published_at timestamptz,
  category text not null,
  subject_name text,
  change_type text check (change_type in ('buff', 'nerf', 'new', 'removed', 'neutral')),
  before_value text,
  after_value text,
  summary text not null,
  evidence_text text,
  confidence numeric(4, 3) not null default 0.5 check (confidence between 0 and 1),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  patch_version_id bigint references public.patch_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_url, source_hash)
);

create table public.weapon_specs (
  weapon_key text primary key,
  name text not null,
  category text not null,
  ammo text,
  base_damage numeric(8, 3) not null,
  rpm integer,
  muzzle_velocity integer,
  magazine_size integer,
  extended_magazine_size integer,
  reload_seconds numeric(6, 3),
  fire_modes text[] not null default '{}',
  falloff_start_m integer,
  falloff_end_m integer,
  minimum_damage_multiplier numeric(6, 4) not null default 1,
  current_patch text,
  source_url text,
  source_kind text not null default 'curated' check (source_kind in ('official', 'telemetry', 'curated', 'estimated')),
  updated_at timestamptz not null default now()
);

create table public.processed_matches (
  match_id text primary key,
  platform text not null,
  game_mode text not null,
  map_name text not null,
  played_at timestamptz not null,
  duration_seconds integer,
  player_count integer,
  telemetry_url text,
  processed_at timestamptz not null default now()
);

create table public.daily_weapon_stats (
  stat_date date not null,
  platform text not null,
  game_mode text not null,
  map_name text not null,
  weapon_key text not null,
  match_count integer not null default 0,
  player_count integer not null default 0,
  attacks bigint not null default 0,
  damage_events bigint not null default 0,
  total_damage numeric(16, 3) not null default 0,
  kills bigint not null default 0,
  headshot_kills bigint not null default 0,
  distance_sum_m numeric(18, 3) not null default 0,
  distance_samples bigint not null default 0,
  winner_holds bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (stat_date, platform, game_mode, map_name, weapon_key)
);

create table public.daily_attachment_stats (
  stat_date date not null,
  platform text not null,
  game_mode text not null,
  map_name text not null,
  weapon_key text not null,
  attachment_key text not null,
  attach_events bigint not null default 0,
  detach_events bigint not null default 0,
  kill_equipped_count bigint not null default 0,
  match_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (stat_date, platform, game_mode, map_name, weapon_key, attachment_key)
);

create table public.daily_loadout_stats (
  stat_date date not null,
  platform text not null,
  game_mode text not null,
  map_name text not null,
  weapon_key text not null,
  attachment_keys text[] not null default '{}',
  loadout_hash text not null,
  kill_count bigint not null default 0,
  unique_players integer not null default 0,
  winner_count bigint not null default 0,
  match_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (stat_date, platform, game_mode, map_name, weapon_key, loadout_hash)
);

create table public.top_player_loadouts (
  snapshot_date date not null,
  platform text not null,
  game_mode text not null,
  player_name text not null,
  account_id text not null,
  rank_metric text not null default 'winner_sample',
  rank_value numeric(16, 3),
  weapon_key text not null,
  attachment_keys text[] not null default '{}',
  sample_matches integer not null default 0,
  source_kind text not null default 'telemetry_sample',
  updated_at timestamptz not null default now(),
  primary key (snapshot_date, platform, game_mode, account_id, weapon_key)
);

create table public.patch_meta_comparisons (
  id bigint generated always as identity primary key,
  patch_version_id bigint not null references public.patch_versions(id) on delete cascade,
  metric text not null,
  subject_type text not null check (subject_type in ('weapon', 'attachment', 'loadout')),
  subject_key text not null,
  platform text not null,
  game_mode text not null,
  map_name text not null,
  before_start date not null,
  before_end date not null,
  after_start date not null,
  after_end date not null,
  before_value numeric(18, 6),
  after_value numeric(18, 6),
  change_percent numeric(18, 6),
  sample_matches_before integer not null default 0,
  sample_matches_after integer not null default 0,
  generated_at timestamptz not null default now(),
  unique (patch_version_id, metric, subject_type, subject_key, platform, game_mode, map_name, before_start, before_end, after_start, after_end)
);

create table public.ingestion_runs (
  id bigint generated always as identity primary key,
  job_name text not null,
  status text not null check (status in ('running', 'succeeded', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_seen integer not null default 0,
  records_written integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index processed_matches_played_at_idx on public.processed_matches (played_at desc);
create index daily_weapon_stats_lookup_idx on public.daily_weapon_stats (weapon_key, stat_date desc, platform, game_mode);
create index daily_attachment_stats_lookup_idx on public.daily_attachment_stats (weapon_key, stat_date desc, platform, game_mode);
create index daily_loadout_stats_lookup_idx on public.daily_loadout_stats (weapon_key, stat_date desc, platform, game_mode);
create index patch_candidates_review_idx on public.patch_candidates (review_status, created_at desc);

alter table public.patch_versions enable row level security;
alter table public.patch_candidates enable row level security;
alter table public.weapon_specs enable row level security;
alter table public.processed_matches enable row level security;
alter table public.daily_weapon_stats enable row level security;
alter table public.daily_attachment_stats enable row level security;
alter table public.daily_loadout_stats enable row level security;
alter table public.top_player_loadouts enable row level security;
alter table public.patch_meta_comparisons enable row level security;
alter table public.ingestion_runs enable row level security;

revoke all on table
  public.patch_versions,
  public.patch_candidates,
  public.weapon_specs,
  public.processed_matches,
  public.daily_weapon_stats,
  public.daily_attachment_stats,
  public.daily_loadout_stats,
  public.top_player_loadouts,
  public.patch_meta_comparisons,
  public.ingestion_runs
from anon, authenticated;

grant select, insert, update, delete on table
  public.patch_versions,
  public.patch_candidates,
  public.weapon_specs,
  public.processed_matches,
  public.daily_weapon_stats,
  public.daily_attachment_stats,
  public.daily_loadout_stats,
  public.top_player_loadouts,
  public.patch_meta_comparisons,
  public.ingestion_runs
to service_role;

grant usage, select on all sequences in schema public to service_role;
