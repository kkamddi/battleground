alter table public.patch_candidates
  add column if not exists summary_ko text,
  add column if not exists subject_key text,
  add column if not exists stat_key text,
  add column if not exists unit text;

create table if not exists public.attachments (
  attachment_key text primary key,
  name text not null,
  category text not null,
  effect_summary text,
  effect_values jsonb not null default '{}'::jsonb,
  recommended_for text[] not null default '{}',
  current_patch text,
  source_url text,
  source_kind text not null default 'curated'
    check (source_kind in ('official', 'telemetry', 'curated', 'estimated')),
  updated_at timestamptz not null default now()
);

create table if not exists public.weapon_attachment_compatibility (
  weapon_key text not null,
  attachment_key text not null references public.attachments(attachment_key) on delete cascade,
  compatible boolean not null default true,
  source_url text,
  verified_at timestamptz,
  primary key (weapon_key, attachment_key)
);

create table if not exists public.patch_changes (
  id bigint generated always as identity primary key,
  patch_version_id bigint not null references public.patch_versions(id) on delete cascade,
  candidate_id bigint unique references public.patch_candidates(id) on delete set null,
  subject_type text not null check (subject_type in ('weapon', 'attachment', 'map', 'ranked', 'system', 'bug_fix')),
  subject_key text,
  stat_key text,
  change_type text not null check (change_type in ('buff', 'nerf', 'new', 'removed', 'neutral')),
  before_value text,
  after_value text,
  unit text,
  summary_ko text not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weapon_spec_history (
  id bigint generated always as identity primary key,
  weapon_key text not null references public.weapon_specs(weapon_key) on delete cascade,
  patch_version_id bigint not null references public.patch_versions(id) on delete cascade,
  patch_change_id bigint references public.patch_changes(id) on delete set null,
  stat_key text not null,
  before_value text,
  after_value text,
  unit text,
  source_url text not null,
  changed_at timestamptz not null,
  unique (weapon_key, patch_version_id, stat_key)
);

create table if not exists public.attachment_spec_history (
  id bigint generated always as identity primary key,
  attachment_key text not null references public.attachments(attachment_key) on delete cascade,
  patch_version_id bigint not null references public.patch_versions(id) on delete cascade,
  patch_change_id bigint references public.patch_changes(id) on delete set null,
  stat_key text not null,
  before_value text,
  after_value text,
  unit text,
  source_url text not null,
  changed_at timestamptz not null,
  unique (attachment_key, patch_version_id, stat_key)
);

create table if not exists public.weapon_loadout_rankings (
  stat_date date not null,
  window_days integer not null check (window_days in (7, 30)),
  platform text not null,
  game_mode text not null,
  map_name text not null default 'all',
  weapon_key text not null,
  attachment_keys text[] not null default '{}',
  loadout_hash text not null,
  kill_count bigint not null default 0,
  unique_players integer not null default 0,
  winner_count bigint not null default 0,
  sample_matches integer not null default 0,
  top_player_observations integer not null default 0,
  popularity_score numeric(12, 6) not null default 0,
  confidence numeric(6, 5) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (stat_date, window_days, platform, game_mode, map_name, weapon_key, loadout_hash)
);

create table if not exists public.progressive_skins (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  weapon_key text not null,
  chroma_name text,
  max_level integer not null default 10 check (max_level between 1 and 20),
  image_url text,
  chroma_image_url text,
  acquisition text,
  pc_sale_start timestamptz,
  pc_sale_end timestamptz,
  console_sale_start timestamptz,
  console_sale_end timestamptz,
  availability_status text not null default 'unknown'
    check (availability_status in ('upcoming', 'available', 'ended', 'returning', 'unknown')),
  source_url text not null,
  source_published_at timestamptz,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  updated_at timestamptz not null default now()
);

create table if not exists public.progressive_skin_levels (
  progressive_skin_id bigint not null references public.progressive_skins(id) on delete cascade,
  level integer not null check (level between 1 and 20),
  unlock_type text not null,
  description_ko text not null,
  image_url text,
  primary key (progressive_skin_id, level)
);

create index if not exists patch_changes_subject_idx
  on public.patch_changes (subject_type, subject_key, patch_version_id desc);
create index if not exists weapon_spec_history_lookup_idx
  on public.weapon_spec_history (weapon_key, changed_at desc);
create index if not exists attachment_spec_history_lookup_idx
  on public.attachment_spec_history (attachment_key, changed_at desc);
create index if not exists weapon_loadout_rankings_lookup_idx
  on public.weapon_loadout_rankings (weapon_key, stat_date desc, window_days, platform, game_mode);
create index if not exists progressive_skins_status_idx
  on public.progressive_skins (review_status, source_published_at desc);

alter table public.attachments enable row level security;
alter table public.weapon_attachment_compatibility enable row level security;
alter table public.patch_changes enable row level security;
alter table public.weapon_spec_history enable row level security;
alter table public.attachment_spec_history enable row level security;
alter table public.weapon_loadout_rankings enable row level security;
alter table public.progressive_skins enable row level security;
alter table public.progressive_skin_levels enable row level security;

revoke all on table
  public.attachments,
  public.weapon_attachment_compatibility,
  public.patch_changes,
  public.weapon_spec_history,
  public.attachment_spec_history,
  public.weapon_loadout_rankings,
  public.progressive_skins,
  public.progressive_skin_levels
from anon, authenticated;

grant select, insert, update, delete on table
  public.attachments,
  public.weapon_attachment_compatibility,
  public.patch_changes,
  public.weapon_spec_history,
  public.attachment_spec_history,
  public.weapon_loadout_rankings,
  public.progressive_skins,
  public.progressive_skin_levels
to service_role;

grant usage, select on all sequences in schema public to service_role;
