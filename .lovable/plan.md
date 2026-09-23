# Lecții opționale

## Ce vrem

Anumite lecții pot fi marcate ca **opționale**. Elevii pot trece peste ele fără provocare (skip challenge), iar întrebările din provocări nu vor mai folosi exerciții din lecțiile opționale.

## Cum va funcționa

1. **În Admin** — la editarea/crearea unei lecții apare o bifă nouă „Lecție opțională", lângă bifa de Premium. În listă, lecția opțională e marcată cu un simbol scurt.
2. **În capitol (elev)** — o lecție opțională:
   - nu mai blochează lecția care urmează: dacă lecția anterioară opțională nu e terminată, următoarea se deschide oricum;
   - este ea însăși mereu deschisă (nu cere provocare de skip);
   - primește o etichetă discretă „Opțional" pe card, ca elevul să înțeleagă că o poate sări.
3. **Provocarea de skip**:
   - exercițiile din lecțiile opționale nu intră în banca de întrebări;
   - lecțiile opționale nu sunt incluse în lista de lecții deblocate la reușită (nu au nevoie de deblocare).
4. Restul rămâne neschimbat: XP, vieți, progres, lecțiile obligatorii se deblochează ca înainte.

## Detalii tehnice

- Migrare: `ALTER TABLE public.lessons ADD COLUMN is_optional boolean NOT NULL DEFAULT false;` (fără schimbări de RLS/GRANT, tabelul există deja).
- `src/hooks/useChapters.ts`: câmp nou `isOptional` pe interfața `Lesson`, mapat din `l.is_optional`.
- `src/pages/ChapterPage.tsx`:
  - `previousDone` devine „toate lecțiile obligatorii anterioare din capitol sunt terminate" (se ignoră lecțiile opționale necompletate);
  - `isLocked = false` pentru lecțiile opționale;
  - badge „Opțional" pe nodul lecției;
  - același criteriu folosit și în calculul lecției-țintă la intrarea în capitol.
- `src/pages/SkipChallengePage.tsx`: filtrare `!l.isOptional` atât la construirea `pool`-ului de exerciții, cât și la `lessonsToUnlock`.
- `src/components/admin/ContentEditor.tsx`: `isOptional` în `lessonForm`, în insert/update și în eticheta din listă.
- Regenerarea tipurilor backend se face automat după migrare.
