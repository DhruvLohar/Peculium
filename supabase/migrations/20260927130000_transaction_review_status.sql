-- Draft transactions captured from bank SMS.
-- Drafts land as PENDING_REVIEW with no category; picking a category flips them to CONFIRMED.
-- Existing rows default to CONFIRMED.

create type public.transaction_status as enum ('PENDING_REVIEW', 'CONFIRMED');

alter table public.transactions
  add column status public.transaction_status not null default 'CONFIRMED',
  add column bank_ref text,
  alter column category drop not null,
  add constraint transactions_category_when_confirmed
    check (status = 'PENDING_REVIEW' or category is not null),
  -- NULLs are distinct, so manually-entered rows (bank_ref = null) are unaffected
  add constraint transactions_user_bank_ref_key unique (user_id, bank_ref);

create index idx_transactions_user_status on public.transactions(user_id, status);
