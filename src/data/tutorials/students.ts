import type { TutorialArticle } from "./types";
import splashAsset from "@/assets/tutorial-creeaza-cont-splash.png.asset.json";
import roleAsset from "@/assets/tutorial-creeaza-cont-role.png.asset.json";
import authAsset from "@/assets/tutorial-creeaza-cont-auth.png.asset.json";
import schoolAsset from "@/assets/tutorial-creeaza-cont-school.png.asset.json";
import xpCapitoleAsset from "@/assets/tutorial-xp-capitole.png.asset.json";
import xpRoadmapAsset from "@/assets/tutorial-xp-roadmap.png.asset.json";
import vietiBarAsset from "@/assets/tutorial-vieti-bar.png.asset.json";
import problemsListAsset from "@/assets/tutorial-problems-list.png.asset.json";
import problemEditorAsset from "@/assets/tutorial-problem-editor.png.asset.json";
import joinClassAsset from "@/assets/tutorial-join-class.png.asset.json";
import provocariAcasaAsset from "@/assets/tutorial-provocari-acasa.png.asset.json";

export const studentTutorials: TutorialArticle[] = [
  {
    slug: "creeaza-cont",
    title: "Cum îți creezi cont și alegi școala",
    excerpt: "Pașii pentru înregistrare, alegerea rolului, alegerea școlii și completarea profilului.",
    durationMin: 4,
    sections: [
      {
        heading: "1. Deschide aplicația",
        body: [
          "Când deschizi PyRo prima dată, ești întâmpinat cu un scurt tur. Apasă „Să începem” ca să treci mai departe la configurarea contului.",
        ],
        image: { src: splashAsset.url, alt: "Ecranul de întâmpinare PyRo cu butonul „Să începem”" },
      },
      {
        heading: "2. Alege rolul",
        body: [
          "Spune-ne cine ești: elev sau profesor. Ca elev te poți alătura unei clase, poți concura cu colegii de liceu și primești provocări de la profesori.",
          "Rolul îl poți schimba mai târziu din pagina Cont dacă e nevoie.",
        ],
        image: { src: roleAsset.url, alt: "Ecranul de selectare a rolului: Sunt Elev / Sunt Profesor" },
      },
      {
        heading: "3. Înregistrare sau autentificare",
        body: [
          "Te poți înregistra cu email și parolă, cu Google sau cu Apple. Toate opțiunile creează același tip de cont.",
          "Dacă alegi email + parolă, primești un email de confirmare — apasă linkul din email ca să-ți activezi contul.",
        ],
        image: { src: authAsset.url, alt: "Ecranul de autentificare cu opțiuni Google, Apple și email/parolă" },
        tip: "Te-ai logat inițial cu Google sau Apple? Poți seta ulterior o parolă din Cont → Profil ca să te poți loga și cu email.",
      },
      {
        heading: "4. Alege școala",
        body: [
          "Caută liceul tău în lista cu peste 1500 de școli din România. Începe să scrii numele și îți sugerăm cele mai bune potriviri (liceele din București apar primele în rezultate).",
          "Alegerea școlii e importantă ca să apari corect în clasamentul școlii și al orașului. Dacă vrei să sari peste acum, poți continua fără liceu și să-l setezi mai târziu din Cont.",
        ],
        image: { src: schoolAsset.url, alt: "Ecranul de alegere a liceului cu bară de căutare" },
        tip: "Dacă școala ta nu apare deloc în listă, scrie-ne la suport și o adăugăm.",
      },
      {
        heading: "5. Setează un nickname",
        body: [
          "Nickname-ul apare în clasamente și e vizibil altor elevi. Poți să-l schimbi oricând din pagina Cont.",
          "Dacă te alături unei clase, profesorul te va vedea cu numele tău real (display name), nu cu nickname-ul.",
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
          "Fiecare capitol conține lecții scurte și interactive, cu exerciții variate: alege varianta corectă, completează spațiile, ordonează liniile de cod, scrie cod real.",
        ],
        image: { src: xpCapitoleAsset.url, alt: "Pagina principală cu cele 6 capitole și progresul fiecăruia" },
      },
      {
        heading: "XP și nivele",
        body: [
          "Primești XP la fiecare exercițiu rezolvat corect. La acumularea unui număr de XP, treci la următorul nivel (sunt 25 în total).",
          "Avatarul tău — un șarpe Python — evoluează prin 10 stadii pe măsură ce crești în nivel: de la „Oul Misterios” la „Master of Python”.",
        ],
        image: { src: xpRoadmapAsset.url, alt: "Drumul spre Master: cele 10 stadii de evoluție a avatarului" },
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
        image: { src: vietiBarAsset.url, alt: "Bara de vieți din colțul dreapta-sus a aplicației" },
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
          "Mergi la „Probleme” din meniul de jos. Ai peste 300 de probleme grupate pe dificultate.",
          "Apasă pe o problemă ca să vezi cerința, exemplele de input/output și editorul.",
        ],
        image: { src: problemsListAsset.url, alt: "Lista de probleme grupate pe capitole" },
      },
      {
        heading: "Editorul",
        body: [
          "Codul tău rulează direct în browser, prin Pyodide. Nu trebuie să instalezi nimic.",
          "Apasă „Rulează” ca să-ți testezi soluția. Ai timeout de 10 secunde pe execuție.",
        ],
        image: { src: problemEditorAsset.url, alt: "Editorul de cod Python cu cerința și butonul Rulează teste" },
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
          "Profesorul îți dă un cod scurt (ex: ABC123). Mergi în pagina Cont → Clase și introdu-l în câmpul „Alătură-te unei clase”.",
          "După ce te alături, profesorul îți poate trimite teste și provocări care apar în notificări.",
        ],
        image: { src: joinClassAsset.url, alt: "Ecran cu alegerea rolului elev și introducerea codului clasei" },
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
        heading: "Unde găsești testele și provocările",
        body: [
          "Testele și provocările primite de la profesor apar direct în pagina Acasă, într-un card dedicat sub bara cu nivelul tău — apeși pe el și intri imediat în test sau provocare.",
          "Le poți vedea și din pagina Cont, la secțiunea clasei tale, unde sunt listate toate cele active.",
        ],
        image: { src: provocariAcasaAsset.url, alt: "Cardul „Vezi provocări” din pagina Acasă cu o provocare primită de la clasă" },
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
