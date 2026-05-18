import type { TutorialArticle } from "./types";

export const studentTutorials: TutorialArticle[] = [
  {
    slug: "creeaza-cont",
    title: "Cum îți creezi cont și alegi școala",
    excerpt: "Pașii pentru înregistrare, alegerea școlii și completarea profilului.",
    durationMin: 3,
    sections: [
      {
        heading: "1. Înregistrare",
        body: [
          "Intră pe pyroskill.info sau deschide aplicația și apasă „Cont". Te poți înregistra cu email și parolă, cu Google sau cu Apple.",
          "După înregistrare, primești un email de confirmare. Apasă linkul din email ca să-ți activezi contul.",
        ],
        image: { alt: "Ecranul de înregistrare PyRo", placeholder: "Screenshot: pagina /auth" },
      },
      {
        heading: "2. Alege școala",
        body: [
          "Prima dată când intri, ți se cere să alegi județul, orașul și școala dintr-o listă cu peste 1500 de licee din România.",
          "Alegerea școlii e obligatorie ca să apari corect în clasamente.",
        ],
        image: { alt: "Onboarding alegere școală", placeholder: "Screenshot: SchoolOnboarding" },
        tip: "Dacă școala ta nu apare, contactează-ne la suport și o adăugăm.",
      },
      {
        heading: "3. Setează un nickname",
        body: [
          "Nickname-ul apare în clasamente. Poți să-l schimbi oricând din pagina Cont.",
        ],
      },
    ],
  },
  {
    slug: "lectii-xp-nivele",
    title: "Cum funcționează lecțiile, XP și nivelele",
    excerpt: "Sistemul de progres: 6 capitole, 25 nivele și avatarul care evoluează.",
    durationMin: 4,
    sections: [
      {
        heading: "Capitole și lecții",
        body: [
          "PyRo are 6 capitole care acoperă programa de clasa a IX-a: bazele Python, variabile, condiționale, bucle, funcții, liste și structuri.",
          "Fiecare capitol conține lecții scurte, în stil Duolingo, cu exerciții variate: alege varianta corectă, completează spațiile, ordonează liniile de cod, scrie cod real.",
        ],
        image: { alt: "Harta capitolelor", placeholder: "Screenshot: pagina Index cu capitole" },
      },
      {
        heading: "XP și nivele",
        body: [
          "Primești XP la fiecare exercițiu rezolvat corect. La acumularea unui număr de XP, treci la următorul nivel (sunt 25 în total).",
          "Avatarul tău — un șarpe Python — evoluează prin 10 stadii pe măsură ce crești în nivel.",
        ],
        image: { alt: "Evoluția avatarului", placeholder: "Screenshot: LevelRoadmap" },
      },
      {
        heading: "Deblocare capitole",
        body: [
          "Următorul capitol se deblochează după ce termini 50% din cel curent. Astfel mergi în ritmul tău.",
        ],
      },
    ],
  },
  {
    slug: "vieti-streak",
    title: "Sistemul de vieți și streak-ul zilnic",
    excerpt: "Cum funcționează cele 5 vieți, regenerarea și streak-ul de zile consecutive.",
    durationMin: 3,
    sections: [
      {
        heading: "Vieți",
        body: [
          "Pornești cu 5 vieți. Pierzi o viață la fiecare răspuns greșit într-o lecție nouă.",
          "Vieţile se regenerează automat în timp. Dacă ai 0 vieți, nu poți începe lecții noi până se regenerează.",
          "Premium îți oferă vieți infinite, ca să exersezi fără limită.",
        ],
        image: { alt: "Bara de vieți", placeholder: "Screenshot: bara cu vieți" },
      },
      {
        heading: "Streak",
        body: [
          "Streak-ul = numărul de zile consecutive în care ai fost activ. O lecție completă pe zi e suficientă.",
          "Dacă sari o zi, streak-ul se resetează la 0. Notificările zilnice te ajută să nu uiți.",
        ],
        tip: "Pe Android și iOS poți primi push notification de reamintire seara.",
      },
    ],
  },
  {
    slug: "rezolva-problema",
    title: "Cum rezolvi o problemă în editorul Python",
    excerpt: "Editorul rulează cod real în browser cu Pyodide, fără setup.",
    durationMin: 4,
    sections: [
      {
        heading: "Pagina Probleme",
        body: [
          "Mergi la „Probleme" din meniul de jos. Ai 60 de probleme grupate pe dificultate.",
          "Apasă pe o problemă ca să vezi cerința, exemplele de input/output și editorul.",
        ],
        image: { alt: "Lista de probleme", placeholder: "Screenshot: ProblemsPage" },
      },
      {
        heading: "Editorul",
        body: [
          "Codul tău rulează direct în browser, prin Pyodide. Nu trebuie să instalezi nimic.",
          "Apasă „Rulează" ca să-ți testezi soluția. Ai timeout de 10 secunde pe execuție.",
        ],
        image: { alt: "Editorul de cod", placeholder: "Screenshot: ProblemSolvePage cu editor" },
        tip: "Dacă te blochezi, poți vedea soluția oficială după câteva încercări.",
      },
    ],
  },
  {
    slug: "alatura-te-clasei",
    title: "Cum te alături unei clase create de profesor",
    excerpt: "Profesorul îți dă un cod. Îl introduci și intri în clasă.",
    durationMin: 2,
    sections: [
      {
        heading: "Codul de clasă",
        body: [
          "Profesorul îți dă un cod scurt (ex: ABC123). Mergi în pagina Cont → Clase și introdu-l în câmpul „Alătură-te unei clase".",
          "După ce te alături, profesorul îți poate trimite teste și provocări care apar în notificări.",
        ],
        image: { alt: "Formular alăturare clasă", placeholder: "Screenshot: StudentTab join class" },
      },
      {
        heading: "Display Name",
        body: [
          "În clasă apari cu numele tău real (display name), nu cu nickname-ul. Profesorul trebuie să te recunoască în catalog.",
        ],
      },
    ],
  },
  {
    slug: "test-sau-provocare",
    title: "Cum dai un test sau o provocare primită",
    excerpt: "Notificările te duc direct la test sau provocare.",
    durationMin: 3,
    sections: [
      {
        heading: "Notificări",
        body: [
          "Când profesorul îți trimite un test sau o provocare, primești o notificare în clopoțelul din colțul aplicației.",
          "Click pe notificare te duce direct la conținutul respectiv.",
        ],
        image: { alt: "Clopoțelul de notificări", placeholder: "Screenshot: NotificationBell" },
      },
      {
        heading: "Test cu timer",
        body: [
          "Unele teste au limită de timp. Vezi timerul în partea de sus. Răspunsurile se salvează automat.",
          "După trimitere, profesorul îți eliberează manual scorul și răspunsurile corecte.",
        ],
      },
    ],
  },
  {
    slug: "premium-elev",
    title: "Premium: ce primești în plus",
    excerpt: "Vieți infinite, sumar personalizat, conținut deblocat.",
    durationMin: 2,
    sections: [
      {
        heading: "Beneficii Premium Elev",
        body: [
          "Vieți infinite — exersezi cât vrei, fără pauze forțate.",
          "Sumar personalizat — vezi lecțiile la care stai mai slab (sub 80%) și pe cele stăpânite (peste 90%).",
          "Acces la întreg conținutul restricționat din curriculum.",
        ],
        image: { alt: "Ecran Premium", placeholder: "Screenshot: PremiumDialog" },
        tip: "Poți să-ți activezi Premium și cu un cupon primit de la profesor.",
      },
    ],
  },
];
