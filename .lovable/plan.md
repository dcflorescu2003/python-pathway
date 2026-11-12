# Lecțiile lipsă și ordinea greșită pe iPhone

## Ce se întâmplă
Pe iPhone se vede catalogul vechi inclus în aplicație („plasa de siguranță”), nu cel din cloud:
- Cloud: Cap. 2 „Prelucrări numerice” (45 lecții), Cap. 3 „Funcții și POO”, Cap. 4 „Fișiere și Interfețe”, Cap. 5 „Liste”, Cap. 6 „Generare și Sortare”; Cap. 1 are 36 lecții.
- Pe telefon: titluri și ordine vechi („Subprograme”, „Liste” pe locul 3) și doar 9–10 lecții/capitol.

Aplicația trece pe catalogul local când încărcarea din cloud eșuează o singură dată (rețea lentă la pornire, sesiune încă nepregătită). Apoi rămâne blocată pe el până la 30 de minute sau la repornire, fără să mai reîncerce.

## Ce schimbăm
1. Dacă am căzut pe catalogul local, reîncercăm automat cloud-ul (după câteva secunde, la revenirea în aplicație și la revenirea conexiunii), până reușește.
2. Încercăm cloud-ul de 2–3 ori înainte de a folosi catalogul local.
3. Catalogul local nu se mai salvează ca valid și nu mai blochează reîncărcarea.
4. Bump de versiune la 1.245 (update necesar în App Store și Google Play).

## Detalii tehnice
- `src/hooks/useChapters.ts`: retry cu backoff în `fetchChapters`; când `lastWasFallback`, React Query primește `staleTime: 0` + `refetchInterval` 15 s până la date cloud; refetch la `online`/focus.
- Fără schimbări în baza de date.
