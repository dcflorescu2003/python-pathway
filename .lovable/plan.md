Am verificat logurile și eroarea este aceeași: `request-email-change` încă primește `401 Invalid JWT` când încearcă să apeleze funcția de trimitere email. Schimbarea anterioară nu a rezolvat cauza deoarece funcția de email are încă validare JWT la gateway, iar apelurile interne cu cheia de backend sunt respinse în formatul actual.

Planul de fix:

1. Ajustez configurarea funcției de email
   - În `supabase/config.toml`, schimb `send-transactional-email` din `verify_jwt = true` în `verify_jwt = false`.
   - Este în linie cu arhitectura Lovable Cloud pentru funcții backend: validarea/autorizarea se face în cod sau prin logica internă, nu la gateway, ca să evităm problema `UNAUTHORIZED_INVALID_JWT_FORMAT`.

2. Păstrez apelul sigur din `request-email-change`
   - Mențin apelul prin clientul admin, nu revin la `fetch` manual.
   - Dacă este nevoie, voi ajusta apelul să trimită explicit cheia internă potrivită, dar fără să expun nimic în frontend.

3. Redeploy funcțiile afectate
   - Redeploy pentru `send-transactional-email`.
   - Redeploy pentru `request-email-change` dacă apar mici ajustări în cod.

4. Validare după deploy
   - Testez fluxul din funcția backend sau verific logurile imediat după redeploy.
   - Confirm că eroarea `Invalid JWT` nu mai apare și că, în cel mai rău caz, orice eroare rămasă ar fi legată de email delivery/queue, nu de autentificarea apelului intern.

După aprobare, aplic fixul și îl deployez. Nu ar trebui să fie nevoie de build nou pentru aplicația iOS, deoarece schimbarea este pe backend.