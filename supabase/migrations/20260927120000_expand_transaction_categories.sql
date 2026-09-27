-- Expand transaction categories for finer-grained expense and income tracking.
-- Existing values are kept; new values are appended to the enum.

-- Expense
alter type public.transaction_category add value if not exists 'Drinks';
alter type public.transaction_category add value if not exists 'Snacks';
alter type public.transaction_category add value if not exists 'Subscriptions';
alter type public.transaction_category add value if not exists 'Entertainment';
alter type public.transaction_category add value if not exists 'Shopping';
alter type public.transaction_category add value if not exists 'Transport';
alter type public.transaction_category add value if not exists 'Bills';
alter type public.transaction_category add value if not exists 'PersonalCare';
alter type public.transaction_category add value if not exists 'Fitness';

-- Income
alter type public.transaction_category add value if not exists 'Freelance';
alter type public.transaction_category add value if not exists 'Refund';
alter type public.transaction_category add value if not exists 'Allowance';

-- Both
alter type public.transaction_category add value if not exists 'Gifts';
alter type public.transaction_category add value if not exists 'Investments';
