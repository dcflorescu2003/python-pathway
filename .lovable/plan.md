## Problemă

În imagine, CG2 apare ca **„Stăpânit” 100%** deși elevul a atins doar **CS 2.4** la 100%, iar restul CS-urilor (2.1, 2.2, 2.3, 2.5) sunt neîncepute.

Cauza: în `CompetencyProfileCard.tsx` (liniile 135–142), procentul pe CG se calculează ca `sum(score) / sum(max)` peste toate CS-urile. CS-urile neatinse au `max = 0`, deci nu contribuie deloc — CG iese 100% din 100% al unui singur CS.

## Soluție propusă

Calculez procentul pe CG ca **media procentajelor pe CS-uri**, considerând CS-urile neîncepute ca `0%`. Astfel un CG cu 1/5 CS la 100% va fi 20% și nu va apărea „Stăpânit”.

**Pragurile pentru etichete rămân aceleași** (definite în `masteryLabel`):

- `≥ 85%` → Stăpânit
- `≥ 60%` → În progres
- `≥ 30%` → Început
- `> 0%` și `< 30%` → Necesită exersare
- `0` CS-uri atinse → Neevaluat

## Modificări

`**src/components/account/CompetencyProfileCard.tsx**` — în `useMemo` pentru `generals`:

- Pentru fiecare CG, calculez mastery = media `(score_sum / max_sum)` pe rândurile cu `max > 0`, împărțit la **numărul total de CS-uri** din CG (inclusiv cele neatinse → contează ca 0).
- Dacă niciun CS din CG nu are date, mastery rămâne `null` (Neevaluat).
- `score`/`max` brute le păstrez doar pentru `overall` (procentul global din header rămâne ponderat — e deja relevant).

Opțional: același principiu și pentru `overall` (media pe CG-uri în loc de sumă brută), pentru consistență. **Întrebare mai jos.**

## Întrebare de clarificare

Vrei ca și **procentul global din header** (badge-ul „X%” lângă titlul cardului) să folosească aceeași logică (media pe CG-uri, deci penalizare pentru CG-uri neîncepute)? Sau îl lăsăm cum e acum (raport brut score/max)?

Recomand să-l aliniem — altfel poți avea header 100% dar CG-uri cu „Început”.  
Da, folosim aceeasi logica