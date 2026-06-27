## Modificări

1. `supabase/functions/reward-life/index.ts` — schimb `MAX_ADS_PER_DAY` din `3` în `10`.
2. `src/components/WatchAdForLivesButton.tsx` — actualizez mesajul toast „toate cele 3 reclame de astăzi" → „toate cele 10 reclame de astăzi".

Restul logicii (reset zilnic, +5 inimi/reclamă, cap 5/5) rămâne neschimbat. Nu sunt necesare modificări de schemă DB.