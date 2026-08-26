# Documentul din cererea de verificare nu se deschide

## Ce am verificat
- Cererea din captură (Groza Sorin) are calea salvată corect: `f8a57307-.../1787748840205-parinte_profesor_GCR.pdf`, iar fișierul există fizic în bucketul `teacher-documents`.
- Politicile de storage permit adminului să citească toate documentele („Admins can view all teacher documents”), deci nu e o problemă de permisiuni.
- Componenta `DocumentAttachmentLink` cere linkul semnat **după** click (`await createSignedUrl`) și abia apoi apelează `window.open`.

Concluzie probabilă (neconfirmată în browser): pentru că `window.open` se execută după un `await`, browserul nu îl mai consideră inițiat de utilizator și blochează tab-ul nou (comportament tipic de popup blocker; la fel se întâmplă în WebView-ul aplicației native). De aceea clickul pare „mort”, fără eroare.

## Ce se schimbă
1. **Deschidere fiabilă**: linkul semnat se cere la afișarea cardului (nu la click), astfel încât elementul devine un `<a href>` real — clickul deschide direct documentul, fără blocare. Linkul se reînnoiește automat când expiră (durată mărită la 5 minute).
2. **Rezervă imediată pentru cazuri blocate**: dacă deschiderea într-un tab nou tot eșuează, documentul se afișează într-un dialog în aplicație (PDF în `<iframe>`, imaginile ca `<img>`), plus butoanele „Descarcă” și „Copiază linkul”.
3. **Erori explicite**: dacă generarea linkului eșuează (fișier lipsă, sesiune expirată, lipsă drepturi), se afișează mesajul concret în loc de niciun feedback.
4. Aceleași îmbunătățiri se aplică automat și în conversația de verificare, care folosește aceeași componentă.

## Detalii tehnice
- Fișier modificat: `src/components/teacher/DocumentAttachmentLink.tsx` (pre-fetch signed URL în `useEffect`, randare ca `<a target="_blank" rel="noopener noreferrer">`, dialog de previzualizare cu shadcn `Dialog`).
- Fără migrații, fără schimbări de politici RLS sau de storage.
- Verificare finală: deschidere reală a cererii din Admin > Profesori > Cereri pentru documentul PDF existent.
