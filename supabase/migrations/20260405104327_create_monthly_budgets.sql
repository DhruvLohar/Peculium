-- 1. Create the Monthly Budgets Table
create table public.monthly_budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  -- Store the month as a strict string like '2024-04' for easy sorting and querying
  month_year text not null check (month_year ~ '^\d{4}-\d{2}$'), 
  
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Ensure a user can only have ONE budget per specific month
  unique(user_id, month_year) 
);

-- 2. Enable RLS
alter table public.monthly_budgets enable row level security;

-- 3. Create RLS Policies
create policy "Users can view their own budgets" 
on public.monthly_budgets for select using (auth.uid() = user_id);

create policy "Users can insert their own budgets" 
on public.monthly_budgets for insert with check (auth.uid() = user_id);

create policy "Users can update their own budgets" 
on public.monthly_budgets for update using (auth.uid() = user_id);

create policy "Users can delete their own budgets" 
on public.monthly_budgets for delete using (auth.uid() = user_id);