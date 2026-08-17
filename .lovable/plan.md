# XP care ajunge sigur în cloud și în clasamente

## Ce am verificat în cod

- La finalizarea unei lecții/probleme, XP-ul se acordă prin apelul de server `award_progress`. Dacă apelul eșuează (semnal slab, sesiune expirată pe telefon), aplicația doar pune un marcaj „de sincronizat” și adaugă XP-ul **doar local**. Nu există nicio reîncercare automată a acelui apel.
- Sincronizarea ulterioară (`resyncFromCloud` / pornirea aplicației) folosește restaurarea fără XP. Deci lecția apare marcată, dar XP-ul câștigat offline nu mai ajunge niciodată în cloud — de aici diferența telefon vs. web.
- La revenirea în aplicație, profilul se recitește din cloud și XP-ul local (mai mare) este suprascris cu cel din cloud. Rezultatul: XP-ul „dispare” la trecerea pe web sau chiar pe telefon după un restart.
- Clasamentele se invalidează doar după un `award_progress` reușit; dacă apelul a eșuat, topurile rămân neschimbate.

## Ce voi construi

1. **Coadă persistentă de acordare XP (outbox)**
   - Fiecare finalizare (lecție, problemă, dezvăluire soluție) se scrie mai întâi într-o coadă locală, per utilizator, în stocarea dispozitivului, apoi se trimite la server.
   - La succes, elementul se scoate din coadă și XP-ul afișat devine cel returnat de server.
   - La eșec, elementul rămâne în coadă cu numărul de încercări și momentul ultimei încercări.

2. **Golirea automată a cozii**
   - La pornirea aplicației și după autentificare.
   - Când dispozitivul revine online (`online`) și când aplicația revine în prim-plan (Capacitor `appStateChange`) sau tabul redevine vizibil.
   - Periodic, cât timp aplicația e deschisă (la ~30 de secunde), doar dacă există elemente în coadă.
   - Trimitere secvențială cu reîncercări eșalonate, ca să nu se blocheze pe erori repetate.

3. **XP afișat corect cât timp există elemente nesincronizate**
   - Recitirea profilului din cloud nu mai scade XP-ul dacă în coadă mai există elemente netrimise: se afișează XP-ul din cloud plus estimarea locală, până la golirea cozii.
   - Imediat ce coada e goală, cloud-ul redevine singura sursă de adevăr (nicio schimbare a regulilor anti-fraudă: XP-ul real se calculează tot pe server).

4. **Clasamente actualizate imediat**
   - După fiecare golire reușită a cozii se invalidează cheile de clasament (clasă, liceu, oraș, național) și profilul.
   - Aceeași invalidare are loc la revenirea aplicației în prim-plan, ca topurile de pe telefon să nu rămână pe cache vechi.

5. **Indicator discret de sincronizare**
   - Un mic marcaj lângă XP („se sincronizează…”) când coada nu e goală, care dispare automat după trimitere. Fără dialoguri.

## Verificare

- Simulare offline: finalizez o lecție fără rețea, revin online, confirm în baza de date că XP-ul și finalizarea apar, iar valoarea din web coincide cu cea de pe telefon.
- Confirm că un element deja acordat nu dublează XP-ul (funcția de server rămâne idempotentă).
- Compar XP-ul din profil cu poziția din toate clasamentele, pe web și pe mobil.

## Detalii tehnice

- `src/hooks/useProgress.ts`: coadă `pyro-award-queue:<userId>` în localStorage, funcție `flushAwardQueue` cu reîncercări (backoff), apelată din boot, `online`, `visibilitychange`, `appStateChange` și un interval condiționat.
- `completeLesson` / `revealSolution` scriu în coadă înainte de RPC; la succes elimină intrarea și aplică `applyServerAward`.
- Refetch-ul de profil ține cont de XP-ul din coadă (adăugare temporară), fără a schimba `mergeProgress` pentru cazul „coadă goală”.
- Invalidare `leaderboard-top` și `leaderboard-user-rank` după fiecare golire a cozii.
- Fără modificări de schemă și fără schimbări în `award_progress` / `restore_progress`.
