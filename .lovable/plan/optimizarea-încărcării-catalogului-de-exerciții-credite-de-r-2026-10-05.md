# Optimizarea încărcării catalogului de exerciții (credite de rețea)

## Situația actuală
- Lecțiile au 3.549 exerciții (~1,7 MB). Problemele sunt 371 (~0,5 MB). Ambele cataloage se descarcă integral la fiecare deschidere a aplicației și apoi la cel mult 30 de minute.
- Cache-ul este separat pentru fiecare cont, așa că același catalog se descarcă din nou după schimbarea contului pe același dispozitiv.
- Catalogul se schimbă rar, doar când se fac editări din Admin. Majoritatea descărcărilor aduc exact aceleași date.

## Ce schimbăm
1. **Marcaj de versiune pentru catalog.** Pe server se păstrează un număr mic de versiune, care crește automat la orice modificare de capitole, lecții, exerciții sau probleme.
2. **Catalogul se salvează pe dispozitiv** (pe telefon și în browser), împreună cu versiunea lui.
3. **La pornire, aplicația verifică doar versiunea**, o cerere de câțiva bytes. Descarcă din nou catalogul numai când versiunea s-a schimbat. Altfel îl afișează instant din memorie.
4. **Un singur catalog comun pe dispozitiv**, indiferent de cont. Conținutul este același pentru toți; Premium-ul și progresul se verifică în continuare separat.
5. **Se descarcă doar coloanele folosite.** Câmpurile pe care ecranele nu le afișează nu mai sunt incluse.

## Efect pentru utilizatori
- Lecțiile apar mai repede la pornire, fiind deja salvate pe dispozitiv.
- Editările din Admin ajung la elevi la următoarea deschidere sau revenire în aplicație, adică mai repede decât acum (până la 30 de minute).
- Progresul, XP-ul, viețile și Premium-ul nu sunt afectate.

## Siguranță
- Dacă verificarea versiunii eșuează, aplicația face ce face acum: descarcă tot catalogul. Pe telefon rămâne și catalogul de rezervă inclus în aplicație.
- Catalogul salvat se șterge la deconectare, ca restul datelor locale.
- Nu se modifică datele existente.

## Update în magazine
Partea de server funcționează imediat. Economia pe telefoane apare doar după un build nou, așa că se face bump la **1.234** (code 234).

## Detalii tehnice
- Migrare: tabel `catalog_version(id int pk default 1, version bigint, updated_at)` cu GRANT SELECT pentru anon/authenticated și RLS read-only. Trigger-ul `AFTER INSERT/UPDATE/DELETE FOR EACH STATEMENT` pe `chapters`, `lessons`, `exercises`, `problem_chapters` și `problems` incrementează versiunea.
- `useChapters.ts` / `useProblems.ts`: query mic `catalog_version`, cache persistent în `localStorage` (cheie `pyro_catalog_v1`, cu versiune), cheile de query fără `user.id`. Se descarcă integral doar la schimbarea versiunii; `staleTime` lung, revalidarea versiunii la focus.
- Pentru `exercises` se selectează explicit coloanele mapate (fără `*`).
- Bump la versiunea 1.234 în Android, iOS și `appVersion.ts`.
- Verificare: build, încărcarea lecțiilor și problemelor în browser și confirmarea în rețea că a doua încărcare aduce doar versiunea.
