-- 1. Create the ENUM types
create type public.transaction_type as enum ('INCOME', 'EXPENSE');
create type public.transaction_category as enum ('Home', 'Groceries', 'Rent', 'Food', 'Travel', 'Salary', 'Health', 'Other');

-- 2. Create the Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type public.transaction_type not null, -- Using the ENUM
  amount numeric(12, 2) not null check (amount > 0),
  category public.transaction_category not null, -- Using the ENUM
  transaction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.transactions enable row level security;

-- 4. Create RLS Policies
create policy "Users can view their own transactions" 
on public.transactions for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" 
on public.transactions for insert with check (auth.uid() = user_id);

create policy "Users can update their own transactions" 
on public.transactions for update using (auth.uid() = user_id);

create policy "Users can delete their own transactions" 
on public.transactions for delete using (auth.uid() = user_id);

-- 5. Create an index on the date and user_id for faster dashboard loading
create index idx_transactions_user_date on public.transactions(user_id, transaction_date desc);