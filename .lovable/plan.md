

# Fix build error + Clasament real din baza de date

## Ce facem

### 1. Fix build error în `useAuth.tsx` (linia 117-128)
Eroarea e cauzată de tipizarea strictă a `SocialLogin.login()` — proprietățile `responseType`, `idToken`, `accessToken` nu există pe toate tipurile din union. Soluția: cast `response.result` ca `any` pentru a evita erorile TS.

### 2. Clasament real din tabelul `profiles`
Înlocuim `MOCK_LEADERBOARD` cu date reale din `profiles`, ordonat descrescător după XP.

**Fișier: `src/pages/LeaderboardPage.tsx`**
- Import `supabase` client și `useQuery`
- Query: `SELECT display_name, xp, streak, avatar_url, school_id FROM profiles ORDER BY xp DESC LIMIT 50`
- Afișăm utilizatorul curent evidențiat (match pe `user_id`)
- Tab-ul „Liceu" filtrează după `school_id`
- Eliminăm `MOCK_LEADERBOARD` și mesajul „clasamentul real va fi disponibil"

### Fișiere modificate
1. **`src/hooks/useAuth.tsx`** — cast `response.result as any` pentru fix TS
2. **`src/pages/LeaderboardPage.tsx`** — query real din `profiles`, eliminare mock data

