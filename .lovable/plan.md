# Partajare teste cu co-profesorii + discuție pe test

Nu e complicat: se construiește peste sistemul de co-profesori deja existent. Estimare: o singură etapă de build.

## Ce va vedea profesorul

1. **Buton „Partajează”** pe fiecare test din lista de teste (doar autorul îl vede).
   - Se deschide o listă cu co-profesorii lui (colegii din clasele unde e titular sau co-profesor), cu bife.
   - Poate retrage partajarea oricând.
2. **Secțiunea „Teste partajate cu mine”** în lista de teste a colegului, cu eticheta „de la Prof. X”.
   - Colegul poate vedea testul complet (inclusiv răspunsurile corecte) și îl poate **duplica** ca să-l folosească la clasele lui.
   - Nu îl poate modifica sau șterge — doar autorul.
3. **Discuție pe test** — sus în pagina testului, o secțiune restrânsă „Discuție (3 mesaje noi)”, care se deschide la click.
   - Toți participanții (autor + colegii cu care e partajat) văd și scriu mesaje.
   - Mesajele apar live, fără reîncărcare.
4. **Notificări** — la fiecare mesaj nou, ceilalți participanți primesc notificare în aplicație + push pe telefon, cu link direct către test. Ca să nu fie spam: maxim o notificare per test la 10 minute per persoană dacă se scriu mai multe mesaje la rând.
   - Notificare și când cineva îți partajează un test.

## De avut în vedere (decizii incluse în plan)

- **Doar co-profesori**: se poate partaja numai cu cineva cu care ai deja o clasă comună. Dacă se elimină co-profesorul din clasă, accesul la testele partajate rămâne (le-a primit deja) — se poate retrage manual.
- **Editarea rămâne la autor**: evităm conflictele când doi oameni modifică același test. Varianta „duplică” rezolvă nevoia de a-l adapta.
- **Limita de teste salvate** (50/100/150): testele partajate nu se numără; o copie duplicată se numără.
- **Securitate**: elevii nu pot vedea niciodată discuția sau testele partajate.
- **Ștergerea testului** șterge și discuția.
- Pe telefon funcționează după update din store (bump de versiune la final).

## Detalii tehnice

- Tabel `test_shares(test_id, shared_with, shared_by, created_at)` unic pe pereche; RLS: autorul gestionează, destinatarul citește. Validare în funcție SECURITY DEFINER `share_test(p_test_id, p_teacher_ids[])` că destinatarii sunt co-profesori comuni.
- Extindere `can_teacher_view_test` cu `OR EXISTS test_shares` → acces automat la `tests` și `test_items` fără politici noi.
- Tabel `test_messages(id, test_id, sender_id, body ≤ 2000, created_at)`; helper `can_access_test_chat(test_id, uid)` (autor sau destinatar); RLS SELECT/INSERT pe helper; Realtime activat, canal unic per test în `useEffect`.
- Trigger AFTER INSERT pe `test_messages` → inserează în `notifications` pentru ceilalți participanți (cu throttle 10 min, link `/teacher?test=<id>`); push prin funcția existentă `send-push`.
- UI: `ShareTestDialog.tsx`, `TestDiscussion.tsx` (Collapsible), integrare în `TestManager.tsx`/`TestBuilder.tsx`; buton „Duplică” pentru testele partajate.
- Teste: regulă „doar co-profesori pot primi partajare” și throttle notificări.
- Bump versiune 1.241.
