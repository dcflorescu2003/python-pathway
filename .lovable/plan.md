# Sincronizare progres + regândire „Semnale suspecte”

## 1. Problemele rezolvate nu apar în browser

Ce am verificat direct în baza de date pentru contul tău (Florescu Cosmin):

- profil: 17.018 XP
- `completed_lessons`: **doar 2 rânduri**, ambele de azi (`problem-rec1`, `problem-rec8`)

Deci nu e o problemă de afișare în browser: în cloud chiar nu există istoricul. Telefonul afișează corect pentru că are copia locală (localStorage/preferences); browserul, fiind alt dispozitiv, pornește gol și vede exact ce e în cloud.

Aplicația are deja un mecanism de push al progresului local la încărcare (`useProgress` → `syncToCloud` → RPC `award_progress`), dar el nu a reușit. Cauza cea mai probabilă, **neconfirmată încă**: `award_progress` refuză cu eroare orice `lesson_id`/`problem-<id>` care nu mai există în tabelele curente (după reimporturile de curriculum, id-urile vechi salvate local au rămas orfane), iar eroarea e doar logată ca `console.warn`, deci push-ul „eșuează în tăcere”.

Pași:

1. **Diagnostic pe telefon (primul pas, obligatoriu):** afișare în ecranul de cont a unui raport de sincronizare — câte lecții/probleme locale există, câte s-au trimis, câte au eșuat și cu ce mesaj/id-uri. Asta confirmă sau infirmă ipoteza de mai sus.
2. **Sincronizare robustă:** push-ul nu se mai oprește la prima eroare, raportează un rezumat (ex. „112 trimise, 8 eșuate”), reîncearcă la reconectare și marchează elementele nesincronizate.
3. **Id-uri orfane:** cele care nu mai există în catalog sunt mapate acolo unde există echivalent evident, iar restul sunt marcate „istoric” și ignorate explicit (nu mai blochează sincronizarea și nu mai apar ca lipsă).
4. **Recuperarea contului tău:** după ce sincronizarea funcționează, se rulează push-ul de pe telefon, apoi verific în baza de date că numărul de probleme rezolvate corespunde și că browserul afișează la fel.

Nu acord XP retroactiv pentru rândurile recuperate — se păstrează XP-ul existent din profil (progresul se aliniază la XP, nu invers).

## 2. Regândirea secțiunii „Semnale suspecte”

Astăzi RPC-ul `admin_get_anomalies` calculează „XP estimat” însumând recompensele itemilor din `completed_lessons` și îl compară cu XP-ul **total, istoric** din profil. Comparația e greșită structural:

- rândurile șterse/orfane (exact cazul tău: 2 itemi vs 17.018 XP) produc diferențe uriașe false;
- XP-ul total include surse care nu apar deloc în `completed_lessons`: reluări (+3), bonus provocare (+10%), recapitulări, activitate mai veche decât actualul catalog;
- conturile vechi sunt penalizate automat față de cele noi.

Noua logică propusă:

- **Fereastră de timp, nu istoric:** se analizează doar XP-ul și itemii dintr-o perioadă recentă (aceeași perioadă aleasă în selectorul de sus), nu totalul de la începutul contului.
- **Eliminarea coloanei „XP estimat / Diferență” în forma actuală.** Semnalele devin comportamentale, cele care chiar indică automatizare:
  - itemi finalizați la interval < 10 secunde (rafale) — se păstrează;
  - număr maxim de itemi într-o oră — se păstrează;
  - itemi cu scor 100% rezolvați mai rapid decât e plauzibil;
  - salt de XP într-o zi mult peste media platformei.
- **Excluderi:** conturi de admin și profesori verificați nu mai apar în listă.
- **Prag de afișare:** un cont apare doar dacă atinge cel puțin două semnale, cu o etichetă de risc (scăzut / mediu / ridicat) în loc de un număr roșu greu de interpretat.
- Coloana „Diferență XP” rămâne disponibilă doar ca informație secundară și doar pentru conturile create după activarea scrierii XP exclusiv pe server, unde comparația chiar are sens.

## Detalii tehnice

- `src/hooks/useProgress.ts`: rezultat detaliat pentru `syncToCloud`/`resyncFromCloud` (trimise / eșuate / id-uri necunoscute), fără oprire la prima eroare.
- `src/components/account/AccountProfileTab.tsx`: afișarea raportului de sincronizare.
- Migrare: rescrierea `public.admin_get_anomalies()` cu parametru `p_days`, semnale comportamentale, excludere admin/profesor verificat, scor de risc.
- `src/components/admin/StatsDashboard.tsx`: tabel „Semnale suspecte” actualizat (coloane noi, badge de risc, transmiterea perioadei selectate).
