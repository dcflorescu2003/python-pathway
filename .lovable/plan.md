

## Problem

When logging in, the chapters/exercises sometimes don't appear until a manual page refresh. This happens because `useChapters` fires its query immediately on mount, before the Supabase auth session is fully restored. Since chapters, lessons, and exercises tables have RLS policies requiring `authenticated` role, the query returns empty or fails silently when the session isn't ready yet. React Query then caches this empty result.

## Solution

Gate the `useChapters` query on auth readiness, and refetch when the user changes.

### Changes

**1. `src/hooks/useChapters.ts`**
- Import `useAuth` hook
- Add `user` to the query key so it refetches when user changes
- Add `enabled: !loading` so the query waits until auth state is settled
- This ensures chapters are only fetched after the Supabase client has a valid session

**2. `src/hooks/useProgress.ts`** (minor)
- Verify cloud data reload triggers correctly on user change (already handled via `prevUserId` ref — no change needed)

### Technical detail

```typescript
// In useChapters:
export function useChapters() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["chapters", user?.id ?? "anon"],
    queryFn: fetchChapters,
    enabled: !loading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
```

Adding `user?.id` to the query key forces a refetch when the user logs in or out. The `enabled: !loading` prevents the query from running before auth is resolved.

