-- Migration: add_joke_authors (Milestone 5)
-- לכל בדיחה: מי ביקש אותה ובאיזה שם. אורח: שתי העמודות null.
-- הנעילה של הטבלה לא משתנה. לא מוחקים ולא משנים עמודות קיימות.

alter table public.jokes
  add column user_id uuid references auth.users (id) on delete set null,
  add column author_name text;

alter table public.jokes
  add constraint jokes_author_name_length
  check (author_name is null or char_length(btrim(author_name)) between 1 and 30);

create index jokes_user_id_idx on public.jokes (user_id);
