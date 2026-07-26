create or replace function public.accumulate_match_stats(
  weapon_rows jsonb,
  attachment_rows jsonb,
  loadout_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.daily_weapon_stats (
    stat_date, platform, game_mode, map_name, weapon_key, match_count, player_count,
    attacks, damage_events, total_damage, kills, headshot_kills, distance_sum_m,
    distance_samples, winner_holds
  )
  select *
  from jsonb_to_recordset(weapon_rows) as row_data(
    stat_date date, platform text, game_mode text, map_name text, weapon_key text,
    match_count integer, player_count integer, attacks bigint, damage_events bigint,
    total_damage numeric, kills bigint, headshot_kills bigint, distance_sum_m numeric,
    distance_samples bigint, winner_holds bigint
  )
  on conflict (stat_date, platform, game_mode, map_name, weapon_key)
  do update set
    match_count = public.daily_weapon_stats.match_count + excluded.match_count,
    player_count = public.daily_weapon_stats.player_count + excluded.player_count,
    attacks = public.daily_weapon_stats.attacks + excluded.attacks,
    damage_events = public.daily_weapon_stats.damage_events + excluded.damage_events,
    total_damage = public.daily_weapon_stats.total_damage + excluded.total_damage,
    kills = public.daily_weapon_stats.kills + excluded.kills,
    headshot_kills = public.daily_weapon_stats.headshot_kills + excluded.headshot_kills,
    distance_sum_m = public.daily_weapon_stats.distance_sum_m + excluded.distance_sum_m,
    distance_samples = public.daily_weapon_stats.distance_samples + excluded.distance_samples,
    winner_holds = public.daily_weapon_stats.winner_holds + excluded.winner_holds,
    updated_at = now();

  insert into public.daily_attachment_stats (
    stat_date, platform, game_mode, map_name, weapon_key, attachment_key,
    attach_events, detach_events, kill_equipped_count, match_count
  )
  select *
  from jsonb_to_recordset(attachment_rows) as row_data(
    stat_date date, platform text, game_mode text, map_name text, weapon_key text,
    attachment_key text, attach_events bigint, detach_events bigint,
    kill_equipped_count bigint, match_count integer
  )
  on conflict (stat_date, platform, game_mode, map_name, weapon_key, attachment_key)
  do update set
    attach_events = public.daily_attachment_stats.attach_events + excluded.attach_events,
    detach_events = public.daily_attachment_stats.detach_events + excluded.detach_events,
    kill_equipped_count = public.daily_attachment_stats.kill_equipped_count + excluded.kill_equipped_count,
    match_count = public.daily_attachment_stats.match_count + excluded.match_count,
    updated_at = now();

  insert into public.daily_loadout_stats (
    stat_date, platform, game_mode, map_name, weapon_key, attachment_keys,
    loadout_hash, kill_count, unique_players, winner_count, match_count
  )
  select *
  from jsonb_to_recordset(loadout_rows) as row_data(
    stat_date date, platform text, game_mode text, map_name text, weapon_key text,
    attachment_keys text[], loadout_hash text, kill_count bigint, unique_players integer,
    winner_count bigint, match_count integer
  )
  on conflict (stat_date, platform, game_mode, map_name, weapon_key, loadout_hash)
  do update set
    attachment_keys = excluded.attachment_keys,
    kill_count = public.daily_loadout_stats.kill_count + excluded.kill_count,
    unique_players = public.daily_loadout_stats.unique_players + excluded.unique_players,
    winner_count = public.daily_loadout_stats.winner_count + excluded.winner_count,
    match_count = public.daily_loadout_stats.match_count + excluded.match_count,
    updated_at = now();
end;
$$;

revoke all on function public.accumulate_match_stats(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.accumulate_match_stats(jsonb, jsonb, jsonb) to service_role;
