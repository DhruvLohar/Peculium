import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabase';

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw new Error(error.message);
      return user;
    },
  });
};
