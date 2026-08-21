# Clasament pe București unificat

## Situația actuală (verificată)

`Colegiul Național „Matei Basarab”` (`lic371`) este deja marcat ca fiind din **București, Sector 3** în catalogul de licee — deci nu lipsește din București.

Problema reală e la clasamentul „Oraș”: el compară orașul exact (`city === "București, Sector 3"`), așa că un elev de la Matei Basarab concurează doar cu liceele din Sectorul 3, nu cu tot Bucureștiul.

## Ce schimbăm

Clasamentul „Oraș” pentru orice liceu bucureștean va include **toate sectoarele**, nu doar sectorul propriu. Pentru restul orașelor din țară nu se schimbă nimic.

Eticheta tabului rămâne „🏙️ Oraș”, dar pentru utilizatorii din Capitală se va afișa clar că este clasamentul pe București.

## Detalii tehnice

- `src/pages/LeaderboardPage.tsx`: la calculul `citySchoolIds`, dacă liceul utilizatorului este bucureștean (folosind helperul existent `isBucharestSchool` din `src/lib/searchUtils.ts`), lista devine toate liceele cu `city` ce începe cu „București”; altfel rămâne potrivirea exactă pe oraș.
- Aceeași listă e deja folosită atât pentru top 15, cât și pentru calculul rangului propriu (`leaderboard-user-rank`), deci ambele devin consistente automat.
- Se afișează numele orașului („București” în loc de „București, Sector 3”) în eticheta contextuală a clasamentului pe oraș.
- Fără modificări în baza de date.
