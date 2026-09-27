import { useQuery } from '@tanstack/react-query';
import { getSessionUser } from '../utils/supabase';

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => getSessionUser(),
  });
};
