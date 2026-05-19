import type { TutorialArticle } from "./types";

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
        heading: "Metode de validare",
        body: [
          "1. Email instituțional (ex: @numeliceu.ro) — automat.",
          "2. Upload adeverință / contract — verificare manuală.",
          "3. Recomandare de la un profesor deja verificat din aceeași școală.",
          "4. Verificare prin chat cu echipa PyRo, dacă nicio variantă de mai sus nu se potrivește.",
        ],
        image: { alt: "Formular verificare profesor", placeholder: "Screenshot: TeacherVerificationForm" },
        tip: "Răspundem la cererile de verificare în 24-48h în zilele lucrătoare.",
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
        image: { alt: "Manager de clase", placeholder: "Screenshot: ClassManager" },
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
        image: { alt: "Test Builder", placeholder: "Screenshot: TestBuilder" },
      },
      {
        heading: "Setări test",
        body: [
          "Setezi: limita de timp, dacă elevii pot rula codul în sandbox Pyodide, dacă afișezi imediat scorul.",
          "Poți crea două variante (A și B) cu reordonare automată ca să eviți copiatul.",
        ],
        tip: "Limita de teste salvate depinde de plan: 50 (Free), 100 (Premium), 150 (AI Teacher).",
      },
    ],
  },
  {
    slug: "trimite-provocare",
    title: "Cum trimiți o provocare individuală",
    excerpt: "Provocările sunt exerciții punctuale trimise unui elev.",
    durationMin: 2,
    sections: [
      {
        heading: "Provocări vs teste",
        body: [
          "Testul = mai multe exerciții, cu timer și scor. Provocarea = un singur exercițiu, trimis unui elev anume.",
          "Folosește provocările ca să-i dai unui elev exerciții suplimentare pe punctul lui slab.",
        ],
        image: { alt: "Asignare provocare", placeholder: "Screenshot: ChallengeAssigner" },
      },
    ],
  },
  {
    slug: "notare-ai",
    title: "Cum funcționează statisticile pentru clasă",
    excerpt: "Exercițiile fixe se notează automat. Codul scris liber e evaluat de AI.",
    durationMin: 4,
    sections: [
      {
        heading: "Notare automată",
        body: [
          "Quiz, true/false, fill-in, ordonare — se notează instant, pe baza răspunsului corect setat de tine.",
        ],
      },
      {
        heading: "Notare cu AI (Gemini)",
        body: [
          "Pentru exercițiile cu cod scris liber, AI-ul evaluează soluția în funcție de cerință și-ți dă scor + feedback.",
          "Pe planul Premium ai max 3 exerciții AI-evaluated per test. Pe AI Teacher, limita e mai mare.",
        ],
        image: { alt: "Rezultate test cu feedback AI", placeholder: "Screenshot: TestResults" },
        tip: "Tu rămâi profesorul: poți suprascrie manual orice scor dat de AI.",
      },
      {
        heading: "Eliberarea răspunsurilor",
        body: [
          "Scorurile și răspunsurile corecte sunt eliberate manual de tine în două stadii, ca să eviți schimbul de răspunsuri între elevi.",
        ],
      },
    ],
  },
  {
    slug: "analitice-rapoarte",
    title: "Cum vezi analitice și exporți rapoarte",
    excerpt: "Grafice pe clasă, performanța per elev, export CSV/PDF.",
    durationMin: 3,
    sections: [
      {
        heading: "Class Analytics",
        body: [
          "În detaliul clasei vezi: media pe test, performanța per elev, evoluția în timp, distribuția scorurilor.",
        ],
        image: { alt: "Dashboard analitice clasă", placeholder: "Screenshot: ClassAnalytics" },
      },
      {
        heading: "Export",
        body: [
          "Poți exporta rapoartele în CSV sau PDF cu un singur click. Util pentru catalog sau pentru raportare la conducerea școlii.",
        ],
        tip: "Exportul PDF e disponibil pe Premium și AI Teacher.",
      },
    ],
  },
  {
    slug: "profil-competente",
    title: "Profilul de competențe (CG/CS/M)",
    excerpt: "Urmărește competențele generale, specifice și microcompetențele.",
    durationMin: 3,
    sections: [
      {
        heading: "Ierarhia CG → CS → M",
        body: [
          "Competențe Generale (CG): direcții mari din programă (ex: rezolvare de probleme, modelare).",
          "Competențe Specifice (CS): obiective concrete sub fiecare CG.",
          "Microcompetențe (M): unități fine, asociate fiecărui exercițiu.",
        ],
      },
      {
        heading: "Cum vezi profilul",
        body: [
          "Pentru fiecare elev vezi câte microcompetențe a atins și unde stă slab. Elevul vede doar CG + CS, nu detaliul M.",
          "Poți să-ți creezi propriile microcompetențe personalizate pentru exercițiile tale custom.",
        ],
        image: { alt: "Profil competențe elev", placeholder: "Screenshot: StudentCompetencyView" },
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
          "Free: până la 50 teste salvate, fără AI grading.",
          "Premium: 100 teste, 3 exerciții AI per test, export PDF.",
          "AI Teacher: 150 teste, limită AI mai generoasă, prioritate la suport.",
        ],
        image: { alt: "Pagina Premium pentru profesori", placeholder: "Screenshot: TeacherPremiumDialog" },
      },
    ],
  },
];
