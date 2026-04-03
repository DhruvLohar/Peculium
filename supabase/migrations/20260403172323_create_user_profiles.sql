-- 1. Create the Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  has_onboarded boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create RLS Policies
-- Users can only read their own profile
create policy "Users can view own profile" 
on public.profiles for select 
using (auth.uid() = id);

-- Users can only update their own profile (crucial for changing has_onboarded to true)
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 4. Create the Trigger Function
-- This function automatically runs when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, has_onboarded)
  values (new.id, false);
  return new;
end;
$$ language plpgsql security definer;

-- 5. Attach the Trigger to Supabase Auth
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();