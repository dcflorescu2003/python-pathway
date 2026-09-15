# Clasamentul clasei: elevii se văd între ei, iar profesorii văd topul clasei

## Cauza (verificată)

Regulile de acces la tabelul cu membrii clasei permit fiecărui elev să vadă **doar propria înscriere**. Pagina de clasament cere lista colegilor din acel tabel, primește un singur rând (al lui) și afișează un clasament cu un singur elev. Nu e o problemă de XP sau de afișare.

Profesorii nu apar niciodată în acel tabel (ei nu sunt membri), deci tabul „Clasă" nici nu li se afișează.

## Ce se schimbă

**Pentru elevi:** tabul „👥 Clasă" arată toți colegii din clasa în care sunt înscriși, ordonați după XP, cu locul propriu evidențiat exact ca în celelalte clasamente.

**Pentru profesori:** apare și pentru ei tabul „👥 Clasă", cu topul elevilor din clasele proprii. Dacă au mai multe clase, un selector deasupra listei permite comutarea între ele. Profesorul nu apare în listă și nu primește loc — rămâne cardul informativ existent „Nu intri în clasament (cont de profesor)".

Restul clasamentelor (Liceu / Oraș / Național) rămân neschimbate.

## Detalii tehnice

Bază de date (o migrare, fără modificarea regulilor de acces existente):

- Funcție nouă `public.get_class_leaderboard(p_class_id uuid)`, `SECURITY DEFINER`, `search_path = public`, cu `EXECUTE` pentru `authenticated`. Returnează `user_id, display_name, nickname, xp, streak, avatar_url` pentru membrii clasei care **nu** sunt profesori, ordonate descrescător după `xp`.
- Acces controlat în corpul funcției: rulează doar dacă `is_class_member(p_class_id, auth.uid())` sau `is_class_teacher(p_class_id, auth.uid())`; altfel returnează zero rânduri. Astfel nu se lărgesc politicile RLS pe `class_members` și nu apare recursivitate.
- Fără coloane sensibile expuse (aceleași câmpuri publice deja folosite din `public_profiles`).

Frontend, `src/pages/LeaderboardPage.tsx`:

- Query-ul `leaderboard-class` pentru elevi: în loc de citirea directă a `class_members`, apelează noul RPC pentru clasa activă (cea mai recentă înscriere) și folosește rezultatul ca listă completă pentru tab.
- Query nou pentru profesor: citește clasele proprii din `teacher_classes` (permis deja de politicile existente); dacă există cel puțin una, tabul „Clasă" devine vizibil, cu state pentru clasa selectată (implicit prima).
- Topul pentru tabul „Clasă" (elev și profesor) vine din RPC, deci `top15`/rangul nu mai depind de `public_profiles` pe acest tab; rangul propriu al elevului se calculează din poziția în lista returnată.
- Selector de clasă pentru profesor: butoane/`Select` cu numele clasei, folosind stilurile și tokenii existenți; se afișează doar când profesorul are mai mult de o clasă.
- Cardul „profesor" existent rămâne, iar linia „Tu" nu se randează pentru conturile de profesor.
