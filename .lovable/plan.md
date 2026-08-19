# Eliminarea plafonului zilnic de XP

Plafonul de 1500 XP/zi penalizează elevii foarte harnici. Îl scoatem complet și păstrăm doar protecțiile care împiedică XP-ul greșit (dublat sau retrimis de build-uri vechi).

## Ce se schimbă

- Se elimină plafonul zilnic din funcția de acordare a progresului. XP-ul devine nelimitat pentru activitate reală.
- Se elimină indicatorul „plafonat" din răspunsul funcției (nu mai are sens).

## Ce rămâne neschimbat (protecțiile anti-eroare)

- XP doar la prima finalizare a unui item; la reluare, XP doar dacă scorul crește (nu se dublează niciodată).
- Scrierea directă pe `xp`, `streak`, `best_streak` din aplicație rămâne blocată; singura cale e funcția de server.
- Istoricul de finalizări nu mai poate fi șters din aplicație (evită scenariul „golesc istoricul → reprimesc tot XP-ul").
- Build-urile mai vechi de 1.117 înregistrează finalizarea, dar nu primesc XP — asta este protecția reală împotriva retrimiterii de istoric local umflat.
- Semnalul din panoul Admin pentru conturi cu XP diferit de istoric rămâne activ.

## Detalii tehnice

- Migrare: `CREATE OR REPLACE FUNCTION public.award_progress(text, integer, boolean, boolean, text)` fără `v_daily_cap`, fără calculul `v_today_xp` și fără câmpul `capped` din JSON-ul returnat. Restul logicii (idempotență, bonus challenge, streak, bypass protecție profil) rămâne identică.
- Fără modificări în frontend: `useProgress.ts` nu citește `capped`.
