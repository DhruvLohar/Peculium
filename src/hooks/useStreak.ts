import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '../utils/supabase';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_streak_updated_at: string | null;
}

/**
 * Hook to fetch current user's streak data
 */
export const useStreak = () => {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async (): Promise<StreakData> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_streak_updated_at')
        .eq('id', user.id)
        .single();

      if (error) throw new Error(error.message);
      return data as StreakData;
    },
  });
};

/**
 * Hook to update streak when a transaction is added
 * Should be called after successfully adding a transaction
 */
export const useUpdateStreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<StreakData> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current streak data
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_streak_updated_at')
        .eq('id', user.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const now = new Date();
      const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const lastUpdate = profile.last_streak_updated_at
        ? new Date(profile.last_streak_updated_at).toISOString().split('T')[0]
        : null;

      let newStreak = profile.current_streak;
      let newLongest = profile.longest_streak;

      // If last update was today, don't increment
      if (lastUpdate === todayDate) {
        return {
          current_streak: newStreak,
          longest_streak: newLongest,
          last_streak_updated_at: profile.last_streak_updated_at,
        };
      }

      // Calculate days since last update
      if (lastUpdate) {
        const lastDate = new Date(lastUpdate);
        const diffTime = now.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day - increment streak
          newStreak += 1;
        } else if (diffDays > 1) {
          // Missed days - reset streak
          newStreak = 1;
        }
      } else {
        // First time tracking streak
        newStreak = 1;
      }

      // Update longest streak if current exceeds it
      if (newStreak > newLongest) {
        newLongest = newStreak;
      }

      // Update database
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_streak_updated_at: now.toISOString(),
        })
        .eq('id', user.id)
        .select('current_streak, longest_streak, last_streak_updated_at')
        .single();

      if (updateError) throw new Error(updateError.message);
      return updated as StreakData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
};
