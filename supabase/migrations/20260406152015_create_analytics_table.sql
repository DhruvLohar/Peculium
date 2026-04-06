-- 1. Create the strongly-typed Enum for your specific events
create type public.app_event_type as enum (
  'AppOpened',
  'ContinuedToLogin',
  'SkippedToLogin',
  'AddTransaction',
  'EditTransaction',
  'DeleteTransaction',
  'UpdateMonthlyBudget',
  'ProfileViewed',
  'ToggledTheme'
);

-- 2. Create the Analytics table
create table public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  
  -- The core fields you requested
  event public.app_event_type not null,
  event_data jsonb default '{}'::jsonb not null, -- JSONB is much faster to query than standard JSON in Postgres
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Fields to track WHO is doing it
  user_id uuid references auth.users(id) on delete set null, -- Nullable because of pre-login events
  device_id text -- Allows you to track anonymous user sessions
);

-- 3. Create Indexes (Crucial for analytics so your queries don't slow down as the table gets massive)
create index idx_analytics_event on public.analytics_events(event);
create index idx_analytics_user_id on public.analytics_events(user_id);
create index idx_analytics_created_at on public.analytics_events(created_at);

-- 4. Set up Row Level Security (RLS)
alter table public.analytics_events enable row level security;

-- POLICY: Anyone can insert an event (Even anonymous users who haven't logged in yet)
create policy "Allow inserts for all app users"
  on public.analytics_events for insert
  with check (true);

-- POLICY: Users can only see their own analytics history (if you ever need to query it in-app)
-- (Your Supabase admin dashboard bypasses this, so you can still see everything)
create policy "Users can view own events"
  on public.analytics_events for select
  using (auth.uid() = user_id);