-- Receipt metadata is written only by authenticated server actions. Browser
-- access is limited to uploading/removing a parent's own student receipt file.
alter table public.payment_receipt_uploads enable row level security;
revoke all privileges on table public.payment_receipt_uploads from public, anon, authenticated;

create or replace function public.can_upload_payment_receipt(
  p_school_id text,
  p_student_id text,
  p_parent_id text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.student as s
    join public.parent as p on p.id = s.parentid
    where s.id = p_student_id
      and s.schoolid = p_school_id
      and p.id = p_parent_id
      and p.userid = auth.uid()::text
  );
$$;

revoke all on function public.can_upload_payment_receipt(text, text, text) from public, anon;
grant execute on function public.can_upload_payment_receipt(text, text, text) to authenticated;

drop policy if exists school_receipts_authenticated_insert on storage.objects;
create policy school_receipts_parent_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'school-receipts'
  and public.can_upload_payment_receipt(
    (storage.foldername(name))[1],
    (storage.foldername(name))[2],
    (storage.foldername(name))[3]
  )
);

drop policy if exists school_receipts_owner_read on storage.objects;
create policy school_receipts_parent_read on storage.objects
for select to authenticated
using (
  bucket_id = 'school-receipts'
  and owner_id = auth.uid()::text
  and public.can_upload_payment_receipt(
    (storage.foldername(name))[1],
    (storage.foldername(name))[2],
    (storage.foldername(name))[3]
  )
);

drop policy if exists school_receipts_parent_delete on storage.objects;
create policy school_receipts_parent_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'school-receipts'
  and owner_id = auth.uid()::text
  and public.can_upload_payment_receipt(
    (storage.foldername(name))[1],
    (storage.foldername(name))[2],
    (storage.foldername(name))[3]
  )
);
