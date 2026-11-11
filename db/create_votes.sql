-- Migration: create_votes (Milestone 6)
-- קול אחד לכל משתמש לכל בדיחה: אהבתי (1) או לא אהבתי (-1).
-- העמודה laughs והפונקציה add_laugh מ-Milestone 4 נשארות. לא מוחקים נתונים.

create table public.votes (
  user_id  uuid        not null references auth.users (id) on delete cascade,
  joke_id  uuid        not null references public.jokes (id) on delete cascade,
  value    smallint    not null check (value in (-1, 1)),
  voted_at timestamptz not null default now(),
  primary key (user_id, joke_id)
);

-- ספירת ההצבעות של בדיחה. המפתח הראשי כבר מכסה חיפוש לפי user_id.
create index votes_joke_id_idx on public.votes (joke_id);

-- נעילה: RLS מופעל, בלי אף policy. רק השרת (service_role) ניגש.
alter table public.votes enable row level security;

revoke all on table public.votes from anon, authenticated;
grant select, insert, update, delete on table public.votes to service_role;


-- הצבעה: 1 או -1 רושמת או מחליפה, 0 מבטלת. כל ערך אחר: שגיאה.
-- בדיחה שלא קיימת: אין שורות בתשובה (השרת מחזיר 404).
-- מחזירה שורה אחת: likes, dislikes ו-my_vote של הבדיחה.
create or replace function public.cast_vote(voter uuid, target uuid, new_value smallint)
returns table (likes integer, dislikes integer, my_vote smallint)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if voter is null or target is null then
    raise exception 'voter and target are required' using errcode = '22004';
  end if;
  if new_value is null or new_value not in (-1, 0, 1) then
    raise exception 'new_value must be -1, 0 or 1' using errcode = '22023';
  end if;

  if not exists (select 1 from public.jokes j where j.id = target) then
    return;
  end if;

  if new_value = 0 then
    delete from public.votes v
    where v.user_id = voter and v.joke_id = target;
  else
    insert into public.votes as v (user_id, joke_id, value)
    values (voter, target, new_value)
    on conflict (user_id, joke_id)
    do update set value = excluded.value, voted_at = now();
  end if;

  return query
    select
      (count(*) filter (where v.value = 1))::integer,
      (count(*) filter (where v.value = -1))::integer,
      (select m.value from public.votes m
        where m.user_id = voter and m.joke_id = target)
    from public.votes v
    where v.joke_id = target;
end;
$$;

revoke execute on function public.cast_vote(uuid, uuid, smallint) from public, anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, smallint) to service_role;


-- רשימות הבדיחות, עם המספרים וההצבעה של מי שצופה (viewer הוא null לאורח).
--   new:   כל הבדיחות, מהחדשה.
--   top:   רק בדיחות עם like אחד לפחות, לפי likes פחות dislikes, ואז לפי likes.
--   liked: רק בדיחות ש-viewer סימן בהן 1, לפי voted_at מהאחרון.
-- max_rows בין 1 ל-50.
create or replace function public.joke_feed(viewer uuid, mode text, max_rows integer default 20)
returns table (
  id          uuid,
  created_at  timestamptz,
  topic       text,
  text        text,
  author_name text,
  likes       integer,
  dislikes    integer,
  my_vote     smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with counts as (
    select
      v.joke_id,
      (count(*) filter (where v.value = 1))::integer  as likes,
      (count(*) filter (where v.value = -1))::integer as dislikes
    from public.votes v
    group by v.joke_id
  ),
  mine as (
    select v.joke_id, v.value, v.voted_at
    from public.votes v
    where viewer is not null and v.user_id = viewer
  )
  select
    j.id,
    j.created_at,
    j.topic,
    j.text,
    j.author_name,
    coalesce(c.likes, 0),
    coalesce(c.dislikes, 0),
    m.value
  from public.jokes j
  left join counts c on c.joke_id = j.id
  left join mine m on m.joke_id = j.id
  where case mode
    when 'new'   then true
    when 'top'   then coalesce(c.likes, 0) >= 1
    when 'liked' then m.value = 1
    else false
  end
  order by
    case when mode = 'top' then coalesce(c.likes, 0) - coalesce(c.dislikes, 0) end desc nulls last,
    case when mode = 'top' then coalesce(c.likes, 0) end desc nulls last,
    case when mode = 'liked' then m.voted_at end desc nulls last,
    j.created_at desc
  limit least(greatest(coalesce(max_rows, 20), 1), 50);
$$;

revoke execute on function public.joke_feed(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.joke_feed(uuid, text, integer) to service_role;
