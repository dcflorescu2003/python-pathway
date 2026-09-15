create or replace function public.get_class_leaderboard(p_class_id uuid)
returns table (
  user_id uuid,
  display_name text,
  nickname text,
  xp integer,
  streak integer,
  avatar_url text,
  school_id text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.user_id, p.display_name, p.nickname, p.xp, p.streak, p.avatar_url, p.school_id
  from public.class_members cm
  join public.profiles p on p.user_id = cm.student_id
  where cm.class_id = p_class_id
    and coalesce(p.is_teacher, false) = false
    and (
      public.is_class_member(p_class_id, auth.uid())
      or public.is_class_teacher(p_class_id, auth.uid())
    )
  order by p.xp desc, p.streak desc
$$;

revoke all on function public.get_class_leaderboard(uuid) from public;
grant execute on function public.get_class_leaderboard(uuid) to authenticated;