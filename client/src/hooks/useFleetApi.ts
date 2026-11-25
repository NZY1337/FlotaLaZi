import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAppContext } from '../context/AppContext';

// Shared plumbing for the fleet resource hooks: every call needs the session
// token, and every mutation refreshes the resources it can affect.

export const useToken = () => useAppContext().session?.access_token;

export function useAuthedQuery<T>(key: QueryKey, fn: (token: string) => Promise<T>) {
    const token = useToken();
    return useQuery({
        // The token is the last key segment so one account never sees another's cache.
        queryKey: [...key, token],
        queryFn: () => fn(token!),
        enabled: !!token,
    });
}

export function useAuthedMutation<V, R>(fn: (token: string, vars: V) => Promise<R>, invalidates: string[]) {
    const token = useToken();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: V) => {
            if (!token) throw new Error('Nu ești autentificat');
            return fn(token, vars);
        },
        onSuccess: () => Promise.all(invalidates.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))),
    });
}
