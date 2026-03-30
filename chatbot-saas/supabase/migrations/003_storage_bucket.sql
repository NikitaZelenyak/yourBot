-- Storage bucket for knowledge base document files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-base-files',
  'knowledge-base-files',
  false,
  10485760, -- 10MB
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- Service role is used for uploads/downloads in the API routes, so no
-- storage RLS policies are needed for those operations.
-- Add a select policy so authenticated users can view their own files
-- (useful for signed URLs if added later).
create policy "kb files: owner read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'knowledge-base-files'
    and (storage.foldername(name))[1] like 'kb-%'
  );
