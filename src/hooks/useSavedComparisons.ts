import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserSavedComparisons,
  createSavedComparison,
  deleteSavedComparison,
  SavedComparison,
} from '../api/savedComparisons';
import { toast } from '../store/useToastStore';

export const SAVED_COMPARISONS_KEY = (userId: string) => ['saved-comparisons', userId];

/**
 * Hook to retrieve user saved comparisons.
 */
export function useSavedComparisons() {
  const { user } = useAuth();
  const userId = user?.uid;

  return useQuery<SavedComparison[], Error>({
    queryKey: SAVED_COMPARISONS_KEY(userId || ''),
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return fetchUserSavedComparisons(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a saved comparison.
 */
export function useCreateSavedComparison() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.uid;

  return useMutation({
    mutationFn: async ({ name, countries }: { name: string; countries: string[] }) => {
      if (!userId) throw new Error('You must be signed in to save a comparison.');
      return createSavedComparison(userId, name, countries);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: SAVED_COMPARISONS_KEY(userId) });
      }
      toast('Comparison saved successfully', 'success');
    },
    onError: (error: any) => {
      console.error('Failed to save comparison:', error);
      toast(error?.message || 'Failed to save comparison', 'error');
    },
  });
}

/**
 * Hook to delete a saved comparison with optimistic updates.
 */
export function useDeleteSavedComparison() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.uid;

  return useMutation({
    mutationFn: async (comparisonId: string) => {
      if (!userId) throw new Error('You must be signed in to delete.');
      return deleteSavedComparison(userId, comparisonId);
    },
    onMutate: async (comparisonId: string) => {
      if (!userId) return;

      const queryKey = SAVED_COMPARISONS_KEY(userId);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<SavedComparison[]>(queryKey);

      // Optimistically remove
      if (previous) {
        queryClient.setQueryData<SavedComparison[]>(
          queryKey,
          previous.filter((item) => item.id !== comparisonId)
        );
      }

      return { previous };
    },
    onError: (error: any, _, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(SAVED_COMPARISONS_KEY(userId), context.previous);
      }
      toast(error?.message || 'Failed to delete comparison', 'error');
    },
    onSuccess: () => {
      toast('Comparison deleted', 'info');
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: SAVED_COMPARISONS_KEY(userId) });
      }
    },
  });
}
