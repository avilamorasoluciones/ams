-- AMS Fly: repair authenticated profile recovery for existing Neon projects.
-- This returns the private phone only to the authenticated account owner.
create or replace function public.ams_fly_get_participant_profile()
returns json
language plpgsql
security definer
set search_path=public,neon_auth
as $$
declare
  v_auth_user_id text:=nullif(trim(auth.user_id()),'');
  v_participant public.ams_fly_participants%ROWTYPE;
  v_first text;
  v_last text;
begin
  if v_auth_user_id is null then raise exception 'auth_required'; end if;

  select * into v_participant
  from public.ams_fly_participants
  where auth_user_id=v_auth_user_id
  limit 1;

  if v_participant.id is null then
    return json_build_object('found',false);
  end if;

  v_first:=split_part(trim(v_participant.player_name),' ',1);
  v_last:=nullif(trim(regexp_replace(trim(v_participant.player_name),'^\\S+\\s*','')),'');

  return json_build_object(
    'found',true,
    'participant_id',v_participant.id,
    'name',v_participant.player_name,
    'first_name',v_first,
    'last_name',coalesce(v_last,''),
    'country',v_participant.country_code,
    'bird_id',v_participant.bird_id,
    'phone',coalesce(v_participant.phone,''),
    'dial',case
      when v_participant.phone like '+57%' then '57'
      when v_participant.phone like '+58%' then '58'
      when v_participant.phone like '+593%' then '593'
      when v_participant.phone like '+1%' then '1'
      when v_participant.phone like '+52%' then '52'
      when v_participant.phone like '+54%' then '54'
      when v_participant.phone like '+56%' then '56'
      when v_participant.phone like '+51%' then '51'
      when v_participant.phone like '+55%' then '55'
      when v_participant.phone like '+507%' then '507'
      else '57'
    end,
    'prize_eligible',coalesce(v_participant.prize_eligible,true),
    'terms_accepted',v_participant.terms_accepted_at is not null,
    'terms_accepted_at',v_participant.terms_accepted_at
  );
end; $$;

revoke all on function public.ams_fly_get_participant_profile() from public;
grant execute on function public.ams_fly_get_participant_profile() to authenticated;
notify pgrst, 'reload schema';
