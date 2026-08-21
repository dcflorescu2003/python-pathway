# Conținut extern în lecții: LIVRESQ (embed) + SCORM 1.2 (import)

## Ce am verificat pe LIVRESQ

- LIVRESQ (Ascendia) e un editor de lecții eLearning care produce materiale **compatibile SCORM și HTML5**.
- Are două căi de distribuire: **publicare în Bibliotecă** (lecția rămâne găzduită la ei, primești un link pe care elevii îl deschid fără cont) și **export** (pachet SCORM/HTML descărcabil, pentru alt LMS).
- Am verificat tehnic `library.livresq.com`: răspunde 200 și **nu trimite `X-Frame-Options` sau `frame-ancestors`**, deci lecțiile lor pot fi afișate într-un `iframe` în PyRo.

## Verdictul pe ideea ta

Da, merge — și e clar mai ieftin ca stocare. Dar are un compromis pe care trebuie să-l accepți explicit:

**O lecție LIVRESQ încărcată prin link rulează pe domeniul lor. Din motive de securitate a browserului, nu putem citi din interiorul acelui iframe niciun scor, progres sau finalizare.** Comunicarea cross-origin cu API-ul SCORM este blocată. Practic: redare da, scor și XP automat nu.

Ca urmare, propun două moduri de conținut extern, alese de admin per lecție:

| Mod | Stocare | Scor / XP | Când îl folosim |
|---|---|---|---|
| **A. Link LIVRESQ (embed)** | zero | fără scor automat | material de citit/parcurs, teorie, demonstrații |
| **B. Import pachet SCORM 1.2** | pachet stocat la noi | scor real → XP | conținut evaluat, unde vrem punctaj |

## Recomandare

Începem cu **modul A (embed LIVRESQ)** — e mult mai simplu, aproape fără stocare, și acoperă cazul „vreau materiale bogate în lecție”. XP-ul îl acordăm ca la exercițiul de tip „card”: elevul parcurge conținutul și apasă „Am terminat” (cu un timp minim petrecut pe pagină, ca să nu fie doar un click), iar XP-ul vine tot prin fluxul server-side existent.

Modul B (SCORM real, cu scor) îl construim doar dacă îți trebuie punctaj automat din material.

## Ce construim — Etapa 1: embed LIVRESQ

### Admin
- Tip nou de exercițiu `embed` în editorul de exerciții.
- Câmpuri: URL-ul lecției, titlu, înălțime preferată, timp minim de parcurgere (secunde), XP.
- Validare de securitate: acceptăm doar URL-uri `https` de pe o **listă albă de domenii** (inițial `livresq.com` și subdomeniile ei). Fără listă albă, un URL greșit sau rău intenționat ar rula conținut arbitrar în aplicație.
- Previzualizare în admin înainte de salvare.

### Elev
- Componentă `EmbedExercise`: `iframe` responsive, cu `sandbox` și `referrerpolicy`, plus fallback „Deschide în filă nouă” dacă lecția refuză încadrarea.
- Buton „Am terminat” activ după timpul minim configurat.
- Pe mobil nativ: afișăm conținutul tot în iframe, iar dacă nu se încarcă, buton de deschidere în browserul de sistem.

### Progres și XP
- Se comportă ca un `card`: nu are răspuns corect/greșit, nu consumă inimi.
- XP-ul se acordă o singură dată, prin fluxul server-side existent (`award_progress`), care rămâne idempotent.

## Etapa 2 (opțională): import SCORM 1.2 cu scor

Doar dacă vrei punctaj automat din material:
- Upload `.zip` în admin, citirea `imsmanifest.xml`, urcarea fișierelor într-un bucket de stocare.
- Redare din același domeniu, cu `window.API` implementat de noi (`LMSInitialize`, `LMSGetValue`, `LMSSetValue`, `LMSCommit`, `LMSFinish`).
- Urmărim `cmi.core.lesson_status`, `cmi.core.score.raw/max`, `cmi.suspend_data` (pentru reluare după întrerupere).
- Tabel de stare SCORM per elev/exercițiu, cu RLS: fiecare elev doar rândul propriu.
- Scorul se normalizează în procent și intră tot prin `award_progress`, plafonat la XP-ul definit de admin.

## Riscuri și limite

- Conținutul găzduit la LIVRESQ dispare din PyRo dacă autorul îl șterge sau retrage publicarea — linkurile se pot rupe în timp. Merită un marcaj în admin pentru lecțiile cu embed.
- Ei pot adăuga oricând `X-Frame-Options`, ceea ce ar bloca încadrarea; de aceea includem fallback-ul „deschide în filă nouă”.
- Aspectul lecțiilor LIVRESQ nu respectă tema PyRo (fundal închis, monospace) — vor arăta ca un corp străin în lecție.
- Fără scor în modul A: dacă un elev doar deschide și închide, tot ia XP-ul după timpul minim. E același nivel de „încredere” ca la exercițiile card.
- SCORM 2004 și xAPI nu sunt incluse.

## Detalii tehnice

- Tipuri noi în `SUPPORTED_EXERCISE_TYPES` (`src/hooks/useChapters.ts`) și în constrângerea CHECK de tip exercițiu din baza de date.
- Coloane noi pe exerciții pentru URL embed, domeniu validat, timp minim.
- Randarea se adaugă în `src/pages/LessonPage.tsx` lângă celelalte tipuri, în `ExerciseErrorBoundary`.
- Lista albă de domenii se validează atât în client (admin) cât și la nivel de bază de date, ca să nu poată fi ocolită.

## Ordinea de implementare

1. Schema: tip `embed`, coloane noi, validare domeniu.
2. Admin: câmpuri + previzualizare.
3. Elev: `EmbedExercise` + timp minim + fallback.
4. Legare la XP prin fluxul existent și test cap-coadă cu o lecție LIVRESQ reală.
5. (Opțional, ulterior) Etapa SCORM cu scor.
