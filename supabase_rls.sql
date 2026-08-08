-- Run this in the Supabase SQL editor (or via `supabase db push` with a migration).
-- Review before running -- these policies assume `documents.user_id`,
-- `chunks.document_id`, and `messages.document_id` (or similar) columns exist.
-- Adjust table/column names to match your actual schema before executing.

alter table documents enable row level security;
alter table chunks enable row level security;
alter table messages enable row level security;

create policy "users own documents"
on documents
for all
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

create policy "users own chunks"
on chunks
for all
using (
  document_id in (
    select id from documents
    where user_id = auth.uid()
  )
)
with check (
  document_id in (
    select id from documents
    where user_id = auth.uid()
  )
);

create policy "users own messages"
on messages
for all
using (
  document_id in (
    select id from documents
    where user_id = auth.uid()
  )
)
with check (
  document_id in (
    select id from documents
    where user_id = auth.uid()
  )
);
