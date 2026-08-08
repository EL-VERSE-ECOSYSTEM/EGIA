-- A browser registration token must only belong to one account at a time.
-- Keep the most recently updated row when repairing any legacy duplicates.
delete from public.user_fcm_tokens older
using public.user_fcm_tokens newer
where older.token = newer.token
  and (older.updated_at < newer.updated_at or (older.updated_at = newer.updated_at and older.id < newer.id));

create unique index if not exists user_fcm_tokens_token_unique
  on public.user_fcm_tokens(token);
