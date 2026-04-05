

# Conținut 100% din baza de date (fără actualizare de aplicație)

## Ce se schimbă

Politicile RLS rămân **neschimbate** — conținutul este accesibil doar utilizatorilor autentificați, exact ca acum. Nu se face nicio migrare SQL.

### 1. Reducere cache în `useChapters.ts`
- `staleTime`: de la 60 min → **5 minute**
- Adăugare `refetchOnWindowFocus: true` — conținut proaspăt la revenirea în app

### 2. Simplificare fallback în `useChapters.ts`
- Pe web: dacă DB-ul returnează date goale, se afișează array gol (trigger empty state), nu se mai încarcă date locale vechi
- Pe nativ (Android): fallback-ul local rămâne pentru offline

### 3. Invalidare cache din Admin (`ContentEditor.tsx`)
- După orice CRUD pe capitole/lecții/exerciții, se apelează `queryClient.invalidateQueries(["chapters"])` pentru refresh imediat

## Fișiere modificate
1. `src/hooks/useChapters.ts` — cache 5min, refetchOnWindowFocus, simplificare fallback web
2. `src/components/admin/ContentEditor.tsx` — invalidare cache după save

## Fără migrare SQL
Politicile RLS existente (`authenticated` SELECT) sunt păstrate intact.

