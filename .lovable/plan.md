# Deschiderea documentelor atașate de profesori (admin)

## Situația actuală (verificată)
- Formularul de verificare încarcă fișierul în bucketul privat `teacher-documents` și salvează calea în `data.document_path` plus numele în `data.file_name`.
- În Admin > Profesori > Cereri se afișează **doar numele fișierului ca text** (`📎 nume.pdf`), fără niciun link — deci documentul nu poate fi deschis.
- În conversația de verificare, atașamentele apar ca text „Document atașat”, tot fără link.
- Permisiunile pe storage sunt deja corecte: există politica „Admins can view all teacher documents”, deci un admin poate genera link semnat fără modificări de securitate.

## Ce se schimbă
1. **Cereri (admin)**: numele fișierului devine un buton „Deschide document” care generează un link semnat temporar (valabil 60 secunde) și îl deschide într-un tab nou. Dacă documentul lipsește sau linkul eșuează, se afișează un mesaj de eroare.
2. **Conversația de verificare**: mențiunea „Document atașat” devine clickabilă (același mecanism de link semnat), atât pentru admin cât și pentru profesor (fiecare vede doar ce are drept să vadă).
3. **Imagini**: dacă documentul e imagine (jpg/png/webp/heic), se afișează și o previzualizare mică pe care se poate da click pentru mărire; PDF/DOC se deschid direct în tab nou.
4. Compatibilitate: dacă o cerere veche are doar `file_name` fără `document_path`, se afișează textul ca acum, cu o notă că fișierul nu are cale salvată.

## Detalii tehnice
- Se folosește `supabase.storage.from("teacher-documents").createSignedUrl(path, 60)` — nu se face bucketul public.
- Fișiere modificate: `src/components/admin/TeacherApproval.tsx`, `src/components/teacher/VerificationChat.tsx`.
- Fără migrații și fără modificări de politici RLS.
