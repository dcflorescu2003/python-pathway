import type { TutorialArticle } from "./types";
import teacherVerificationAsset from "@/assets/teacher-verification-form.png.asset.json";
import classManagerAsset from "@/assets/class-manager.png.asset.json";
import testBuilderAsset from "@/assets/test-builder.png.asset.json";
import challengeAssignerAsset from "@/assets/challenge-assigner.png.asset.json";
import testResultsAsset from "@/assets/test-results.png.asset.json";
import classAnalyticsAsset from "@/assets/class-analytics.png.asset.json";
import studentCompetencyAsset from "@/assets/student-competency-view.png.asset.json";
import teacherPremiumDialogAsset from "@/assets/teacher-premium-dialog.png.asset.json";

export const teacherTutorials: TutorialArticle[] = [
  {
    slug: "profesor-verificat",
    title: "Cum devii profesor verificat",
    excerpt: "4 metode de validare ca să ai acces la funcțiile de profesor.",
    durationMin: 4,
    sections: [
      {
        heading: "De ce verificare?",
        body: [
          "Funcțiile de profesor (clase, teste, analitice) sunt rezervate cadrelor didactice reale, ca să protejăm elevii.",
          "După verificare, contul tău primește rol „profesor” și ai acces la toate uneltele.",
        ],
      },
      {
        heading: "Cod de invitație, Link public, Document și Cod de la un profesor",
        body: [
          "Alege metoda care ți se potrivește pentru a-ți verifica calitatea de profesor. Odată verificat, contul primește rol „profesor” și acces la clase, teste, provocări și analitice.",
          "Cod de invitație — ai primit un cod de la școală sau de la administrator. Introdu codul în formular și contul devine profesor verificat instant, fără așteptare manuală.",
          "Link public — trimite un link unde apari ca profesor: pagina catedrei de pe site-ul școlii, un articol în catalogul profesorilor, orice sursă publică care confirmă relația ta cu liceul. Echipa PyRo verifică manual legătura.",
          "Document — încarcă o poză sau un PDF cu legitimația/adeverința de la școală. Poți ascunde date sensibile (CNP, serie, număr document) — ne interesează doar numele, școala și calitatea de profesor.",
          "Cod de la un profesor — un coleg deja verificat din aceeași școală îți poate genera un cod de recomandare. Introdu codul primit și devii profesor verificat fără verificare suplimentară.",
        ],
        image: { src: teacherVerificationAsset.url, alt: "Ecranul „Verificare profesor” cu cele 4 metode: Cod de invitație, Link public, Document și Cod de la un profesor" },
        tip: "Pentru link public și document, răspundem în 24-48h în zilele lucrătoare. Celelalte două metode sunt active imediat dacă codul este valid.",
      },
    ],
  },
  {
    slug: "creeaza-clasa",
    title: "Cum creezi o clasă și adaugi elevi",
    excerpt: "Generezi un cod de clasă și-l împărtășești cu elevii tăi.",
    durationMin: 3,
    sections: [
      {
        heading: "Creare clasă",
        body: [
          "Mergi în Cont → Clase → „Adaugă clasă nouă”. Dă-i un nume (ex: „9A — Liceul X 2025-2026”).",
          "Sistemul generează un cod scurt (ex: ABC123). Trimite codul elevilor — îl folosesc ca să se alăture.",
        ],
        image: { src: classManagerAsset.url, alt: "Manager de clase: ecranul de creare cu numele clasei și butonul Creează" },
      },
      {
        heading: "Roster",
        body: [
          "După ce elevii se alătură, îi vezi în roster cu numele lor real. Poți să elimini elevi care s-au înscris greșit.",
          "Un elev poate fi într-o singură clasă activă la un moment dat.",
        ],
      },
    ],
  },
  {
    slug: "construieste-test",
    title: "Cum construiești un test",
    excerpt: "Eval Bank predefinit sau test custom cu exercițiile tale.",
    durationMin: 5,
    sections: [
      {
        heading: "Două surse",
        body: [
          "Eval Bank — bibliotecă de exerciții predefinite pe capitole și competențe. Alegi de acolo.",
          "Test custom — îți construiești propriile exerciții: quiz, true/false, fill-in, completare cod, problemă cu cod real.",
        ],
        image: { src: testBuilderAsset.url, alt: "Ecranul de creare test cu setări: puncte din oficiu, limită de timp, variante, anti-fraudă, bancă de testare și butonul Creează test" },
      },
      {
        heading: "Setări test",
        body: [
          "Setezi: limita de timp, dacă elevii pot rula codul în sandbox Pyodide, dacă afișezi imediat scorul.",
          "Poți crea două variante (A și B) cu reordonare automată ca să eviți copiatul.",
        ],
        tip: "Limita de teste salvate depinde de plan: 20 (Free), 40 (Premium), 60 (AI Teacher).",
      },
    ],
  },
  {
    slug: "cum-functioneaza-testele",
    title: "Cum funcționează testele",
    excerpt: "Ce se întâmplă de la pornirea testului până la publicarea notelor: variante, anti-fraudă, întreruperi și dispozitive.",
    durationMin: 6,
    sections: [
      {
        heading: "Atribuirea testului",
        body: [
          "După ce ai creat testul, îl atribui unei clase. Elevii îl văd în contul lor și îl pot începe doar cât timp este activ.",
          "Fiecare elev primește automat un număr și o variantă (A sau B), după ordinea alfabetică din clasă, ca doi colegi alăturați să nu aibă aceleași cerințe.",
        ],
      },
      {
        heading: "În timpul testului",
        body: [
          "Cronometrul pornește când elevul deschide testul și continuă să curgă chiar dacă elevul iese din test.",
          "Răspunsurile se salvează pe server pe parcurs, așa că nu se pierd dacă se închide aplicația sau cade internetul.",
          "Dacă ai permis rularea codului, elevii își pot testa programele înainte de a trimite.",
        ],
      },
      {
        heading: "Modurile anti-fraudă",
        body: [
          "Strict — dacă elevul părăsește ecranul testului mai mult de 1 secundă, testul se trimite automat.",
          "Normal — testul se trimite automat după 3 secunde în afara ecranului.",
          "Relaxat — după 5 secunde testul nu se trimite, ci este marcat „Întrerupt”, iar răspunsurile rămân salvate.",
          "Indiferent de mod, vezi în rezultate de câte ori a ieșit fiecare elev din test.",
        ],
      },
      {
        heading: "Un singur dispozitiv per elev",
        body: [
          "Testul poate fi dat de pe un singur dispozitiv. Dacă cineva îl deschide cu datele elevului de pe alt telefon sau calculator, este blocat și nu vede întrebările.",
          "În pagina de rezultate vezi lângă fiecare elev dispozitivul folosit (de exemplu „Android · Aplicație” sau „Windows · Chrome”) și un semn roșu dacă cineva a încercat să intre din alt loc.",
          "Dacă elevului i s-a descărcat telefonul sau trebuie să schimbe calculatorul, apasă „Permite dispozitiv nou”. Elevul continuă de unde a rămas, iar schimbarea rămâne notată în rezultate.",
        ],
        tip: "Dacă elevul lucrează pe telefon în bancă, dar în rezultate apare un calculator, merită verificat cine rezolvă de fapt testul.",
      },
      {
        heading: "Întreruperi și reluări",
        body: [
          "„Permite continuarea” — pentru un test întrerupt: elevul revine cu răspunsurile păstrate.",
          "„Permite reluarea” — pentru un test trimis automat din cauza ieșirii din ecran, când consideri că a fost o problemă tehnică.",
        ],
      },
      {
        heading: "Corectare și publicarea rezultatelor",
        body: [
          "Itemii cu răspuns fix se corectează automat. Problemele de cod pot fi evaluate cu AI, iar tu poți modifica orice punctaj.",
          "Elevii nu văd nota, răspunsurile sau baremul până nu publici tu rezultatele. Astfel poți verifica totul în liniște.",
        ],
        image: { src: testResultsAsset.url, alt: "Pagina de rezultate ale testului cu lista elevilor și punctajele" },
      },
    ],
  },
  {
    slug: "trimite-provocare",
    title: "Cum trimiți o provocare",
    excerpt: "Trimite exerciții și probleme unei clase; elevii le rezolvă în ritmul lor.",
    durationMin: 2,
    sections: [
      {
        heading: "Provocări pentru clasă",
        body: [
          "O provocare este o selecție de exerciții și probleme pe care o trimiți unei clase. Elevii le primesc pe toate și le rezolvă în ritmul lor, fără timer sau presiune.",
          "Poți alege din lecții (quiz, true/false, fill-in, ordonare, cod) sau din probleme cu evaluator Python.",
          "Elevii văd provocarea în pagina Acasă sau Cont și pot relua orice item până îl termină corect.",
        ],
        image: { src: challengeAssignerAsset.url, alt: "Ecranul de atribuire provocări cu lista de capitole, butoanele Lectii/Probleme și acțiunea Atribuie" },
        tip: "Folosește provocările pentru teme suplimentare, recapitulare sau exerciții pe puncte slabe — fără deadline strict.",
      },
    ],
  },
  {
    slug: "notare-ai",
    title: "Cum funcționează statisticile pentru clasă",
    excerpt: "Notare automată și cu AI, rezultate publicate de tine, provocări cu termen și marcaj „După termen”.",
    durationMin: 5,
    sections: [
      {
        heading: "Notare automată",
        body: [
          "Quiz, adevărat/fals, completare, ordonare — se notează instant, pe baza răspunsului corect setat de tine.",
          "La completare poți accepta mai multe variante corecte; răspunsurile care conțin caractere precum |, virgulă sau punct și virgulă sunt recunoscute corect.",
        ],
      },
      {
        heading: "Notare cu AI (Gemini)",
        body: [
          "Pentru exercițiile cu cod scris liber, AI-ul evaluează soluția în funcție de cerință și îți dă scor + feedback.",
          "Cu planul Premium AI poți include până la 3 itemi evaluați de AI pe test.",
        ],
        image: { src: testResultsAsset.url, alt: "Rezultat test cu cod trimis de elev, feedback AI și nota 10/10, cu posibilitatea de a suprascrie scorul" },
        tip: "Tu rămâi profesorul: poți suprascrie manual orice scor dat de AI.",
      },
      {
        heading: "Publicarea rezultatelor",
        body: [
          "Elevii văd „Rezultat în așteptare” până când publici tu notele. Scorurile, răspunsurile și baremul rămân ascunse până atunci.",
          "Eliberarea se face în două etape (întâi scorul, apoi răspunsurile corecte), ca să eviți schimbul de răspunsuri între elevi.",
        ],
      },
      {
        heading: "Provocări în statistici",
        body: [
          "Pentru fiecare provocare vezi cine a terminat, scorul obținut și dacă elevul a apelat la „Vezi rezolvarea”.",
          "Dacă ai setat termen, elevii care finalizează după termen sunt marcați neutru cu „După termen” (gri, nu roșu), iar sumarul arată câți au întârziat. Termenul expiră la sfârșitul zilei, ora României.",
        ],
      },
    ],
  },
  {
    slug: "analitice-rapoarte",
    title: "Cum vezi analitice și exporți rapoarte",
    excerpt: "Grafice pe clasă, fișa completă a elevului, raport complet și rapoarte dedicate părinților.",
    durationMin: 4,
    sections: [
      {
        heading: "Analitice pe clasă",
        body: [
          "În detaliul clasei vezi: media pe test, performanța per elev, evoluția în timp și distribuția scorurilor.",
        ],
        image: { src: classAnalyticsAsset.url, alt: "Tabel rezultate test pentru clasă cu elevii, variante, scoruri, maxim și procente, plus detaliu per item cu tip, punctaj și feedback" },
      },
      {
        heading: "Fișa completă a elevului",
        body: [
          "Conține XP, streak, lecții, medii la teste, problemele rezolvate pe capitole (cele la care a cerut rezolvarea sunt marcate distinct) și o secțiune „Provocări” cu termen, status și scor.",
          "Tabelul de competențe arată: Grad de stăpânire, Lecții parcurse, Probleme rezolvate și Itemi parcurși.",
          "„Itemi parcurși” = câte exerciții/itemi legați de acea competență a lucrat elevul. Nu înseamnă reluări sau greșeli, de aceea numărul poate fi mare.",
        ],
      },
      {
        heading: "Export pentru profesori și pentru părinți",
        body: [
          "Raport complet (statistici) și fișa elevului se pot exporta în CSV sau PDF, util pentru catalog sau conducerea școlii.",
          "Raport părinți — din fișa elevului: rezumat în limbaj simplu, fără coduri CG/CS, cu explicații pe înțelesul oricui.",
          "Raport părinți — din statistici: prima pagină are date generale despre clasă fără numele copiilor, urmată de câte o fișă simplificată pentru fiecare elev.",
        ],
        tip: "Exportul PDF e disponibil pe Premium și AI Teacher.",
      },
    ],
  },
  {
    slug: "profil-competente",
    title: "Profilul de competențe (CG/CS/M)",
    excerpt: "Ce înseamnă competențele și cum se calculează nivelul: corectitudine + lecții + probleme.",
    durationMin: 4,
    sections: [
      {
        heading: "Ierarhia CG → CS → M",
        body: [
          "Competențe Generale (CG): direcții mari din programă (ex: rezolvare de probleme, modelare).",
          "Competențe Specifice (CS): obiective concrete sub fiecare CG.",
          "Microcompetențe (M): unități fine, asociate fiecărui exercițiu, problemă sau item de test.",
        ],
      },
      {
        heading: "Cum se calculează nivelul",
        body: [
          "Procentul afișat arată corectitudinea răspunsurilor. Nivelul ține cont și de cât din materie a fost parcursă:",
          "Avansat — cel puțin 85% răspunsuri corecte, 90% din lecțiile legate de competență și 30% din problemele legate de ea.",
          "Consolidat — cel puțin 70% corectitudine și 50% din lecții.",
          "De bază — cel puțin 50% corectitudine și 25% din lecții.",
          "În curs de dobândire — sub aceste praguri (marcat neutru, nu ca eșec).",
        ],
        tip: "Un elev cu 100% corectitudine, dar puține lecții parcurse, nu ajunge direct la Avansat — trebuie să acopere și materia.",
      },
      {
        heading: "Toate datele sau doar teste",
        body: [
          "Fila „Toate” include lecții, probleme și teste. Fila „Doar teste” arată doar itemii din testele date la clasă, inclusiv cei preluați din banca de exerciții și probleme.",
        ],
      },
      {
        heading: "Cum vezi profilul",
        body: [
          "Pentru fiecare elev vezi sub fiecare competență „Lecții X/Y · Probleme A/B”. Elevul vede același calcul, dar doar CG + CS, fără detaliul M.",
          "Poți să-ți creezi propriile microcompetențe pentru exercițiile tale custom.",
        ],
        image: { src: studentCompetencyAsset.url, alt: "Profil de competențe elev: competențe generale (CG) cu procente, bare de progres și niveluri" },
      },
    ],
  },
  {
    slug: "premium-profesor",
    title: "Premium Profesor: ce primești în plus",
    excerpt: "Mai multe teste, AI grading extins, export PDF, vieți infinite.",
    durationMin: 2,
    sections: [
      {
        heading: "Planuri",
        body: [
          "Free: până la 20 teste salvate, fără AI grading.",
          "Premium: 40 teste, 3 exerciții AI per test, export PDF.",
          "AI Teacher: 60 teste, limită AI mai generoasă, prioritate la suport.",
        ],
        image: { src: teacherPremiumDialogAsset.url, alt: "Dialog Premium Profesor AI: 60 teste salvate, 4 itemi AI per test, feedback automat, statistici avansate, corectură AI și vieți nelimitate" },
      },
    ],
  },
];
