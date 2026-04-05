-- Add streak tracking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_streak_updated_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.current_streak IS 'Current consecutive days with transactions';
COMMENT ON COLUMN public.profiles.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN public.profiles.last_streak_updated_at IS 'Last date when streak was updated (for daily increment logic)';

-- Create index for efficient streak queries
CREATE INDEX idx_profiles_streak ON public.profiles(current_streak DESC);
