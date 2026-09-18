import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Code2,
  Trophy,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import FeatureCard from "@/components/web/FeatureCard";
import AppDownloadCTA from "@/components/web/AppDownloadCTA";
import PyroLogo from "@/components/brand/PyroLogo";
import { Button } from "@/components/ui/button";
import { useSeoHead } from "@/hooks/useSeoHead";

const studentFeatures = [
  {
    icon: BookOpen,
    title: "Lecții interactive scurte",
    description: "Peste 1500 de exerciții și probleme, grupate pe capitole, cu progres pas cu pas.",
  },
  {
    icon: Code2,
    title: "Editor Python în browser",
    description: "Codul rulează direct în browser, fără instalări și fără configurări.",
  },
  {
    icon: Trophy,
    title: "XP, nivele și clasamente",
    description: "Câștigi XP, urci în nivel și te compari cu colegii din școală, oraș sau la nivel național.",
  },
];

const teacherFeatures = [
  {
    icon: Users,
    title: "Clase și cod de înrolare",
    description: "Creezi clasa, generezi codul de înrolare și urmărești elevii cu numele real.",
  },
  {
    icon: FileText,
    title: "Teste predefinite sau proprii",
    description: "Folosești testele existente sau construiești unele noi cu propriile exerciții.",
  },
  {
    icon: BarChart3,
    title: "Date statistice",
    description: "Grafice de performanță pentru clasă și export CSV / PDF pentru rapoarte.",
  },
];

const chapters = [
  {
    title: "1. Primele linii de cod",
    text: "Ce este un program, cum afișezi text cu print(), cum citești date cu input() și cum scrii primul tău script Python complet.",
  },
  {
    title: "2. Variabile și tipuri de date",
    text: "Numere întregi, zecimale, text și valori adevărat/fals. Înveți să păstrezi informații în variabile și să le transformi dintr-un tip în altul.",
  },
  {
    title: "3. Operatori și expresii",
    text: "Operații matematice, comparații și operatori logici. Construiești expresii care calculează și iau decizii simple.",
  },
  {
    title: "4. Condiții: if, elif, else",
    text: "Programele tale încep să „gândească”: execută cod diferit în funcție de situație, de la verificarea unei note până la meniuri interactive.",
  },
  {
    title: "5. Bucle: for și while",
    text: "Repetați instrucțiuni fără să le rescrii: numărători, sume, tabele de înmulțire și parcurgerea listelor, pas cu pas.",
  },
  {
    title: "6. Liste și funcții",
    text: "Organizezi colecții de date în liste și îți structurezi codul în funcții reutilizabile — baza oricărui program serios.",
  },
];

const faqs = [
  {
    q: "Este PyRo gratuit?",
    a: "Da. Poți crea un cont gratuit și poți parcurge toate lecțiile de bază fără să plătești nimic. Există și un abonament Premium opțional, care oferă inimi nelimitate și funcții suplimentare, dar nu este obligatoriu pentru a învăța.",
  },
  {
    q: "Ce clasă acoperă PyRo?",
    a: "Curriculum-ul este aliniat cu programa de informatică pentru clasa a IX-a (limbajul Python), dar aplicația este potrivită pentru orice începător, indiferent de vârstă, care vrea să învețe programare de la zero.",
  },
  {
    q: "Trebuie să instalez ceva?",
    a: "Nu. PyRo funcționează direct în browser, iar codul Python rulează pe dispozitivul tău prin tehnologia WebAssembly. Dacă preferi, există și aplicații native pentru Android și iOS, cu același cont și același progres.",
  },
  {
    q: "Cum intru în clasa profesorului meu?",
    a: "Profesorul îți dă un cod de înrolare format din 6 caractere. Îl introduci în aplicație, la secțiunea „Clasa mea” și de acolo primești teste și provocări direct în contul tău.",
  },
  {
    q: "Ce sunt inimile și streak-ul?",
    a: "Ai 5 inimi care se consumă când greșești și se reîncarcă automat — pe web aproape instant, pe telefon după 30 de minute sau vizionând o reclamă. Streak-ul numără zilele consecutive în care ai lucrat și te motivează să nu întrerupi ritmul.",
  },
  {
    q: "Sunt profesor. Ce pot face cu PyRo?",
    a: "Poți crea clase virtuale, poți da teste predefinite sau construite de tine, iar aplicația le corectează automat — inclusiv codul liber, evaluat cu AI. Vezi statistici pe clasă și pe elev și poți exporta rapoarte în CSV sau PDF.",
  },
];

const LandingPage = () => {
  useSeoHead({
    canonicalPath: "/",
    ogTitle: "PyRo — Învață Python pas cu pas",
    ogDescription:
      "Lecții interactive de Python pentru elevi de liceu: exerciții, probleme, XP și clasamente. Unelte complete pentru profesori: clase, teste și corectare automată.",
    ogType: "website",
  });

  return (
    <WebLayout>
      <Helmet>
        <title>PyRo — Învață Python pas cu pas, exersând</title>
        <meta
          name="description"
          content="PyRo este aplicația gratuită de învățat Python pentru elevi de clasa a IX-a și începători: lecții interactive, editor de cod în browser, XP, clasamente și unelte pentru profesori."
        />
      </Helmet>

      {/* Hero */}
      <section className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <PyroLogo className="h-16 w-16" />
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            Învață Python pas cu pas, exersând
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            PyRo este o aplicație educațională de programare în Python pentru elevi de liceu și
            începători: lecții scurte, exerciții practice, probleme de rezolvat și clasamente.
            Profesorii pot crea clase și pot da teste direct în aplicație.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Creează cont gratuit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">Vezi cum funcționează</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cum funcționează */}
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Cum funcționează</h2>
          <p className="mt-2 text-muted-foreground">
            De la cont la primul program funcțional, în patru pași simpli.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                title: "Îți faci cont gratuit",
                text: "Te înregistrezi cu email, Google sau Apple și îți alegi școala din listă. Durează sub un minut și nu ai nevoie de card.",
              },
              {
                n: "02",
                title: "Parcurgi lecțiile",
                text: "Fiecare lecție explică un concept pe scurt, apoi te pune să-l aplici imediat în exerciții: completat cod, reordonat linii, ales răspunsuri.",
              },
              {
                n: "03",
                title: "Scrii cod real",
                text: "La probleme, scrii programe Python complete în editorul din browser și vezi rezultatul pe loc. Codul rulează pe dispozitivul tău, fără server.",
              },
              {
                n: "04",
                title: "Câștigi XP și urci",
                text: "Fiecare exercițiu rezolvat îți aduce XP, urci în nivel și avatarul tău șarpe Python evoluează. Te compari cu colegii în clasamente pe școală, oraș și național.",
              },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="font-mono text-2xl font-bold text-primary/40">{step.n}</div>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ce înveți */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold sm:text-3xl">Ce înveți în PyRo</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Curriculum-ul acoperă programa de informatică pentru clasa a IX-a, structurată în șase
          capitole care merg de la zero până la programe complete cu liste și funcții.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {chapters.map((c) => (
            <div key={c.title} className="rounded-xl border border-border/60 p-5">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pentru elevi */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Pentru elevi</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            PyRo transformă învățarea programării într-o experiență aproape de un joc. În loc să
            citești pagini întregi de teorie, rezolvi exerciții scurte și primești răspuns imediat:
            știi din secundă dacă ai rezolvat corect și, dacă greșești, vezi soluția explicată.
            Ai 5 inimi care se reîncarcă automat, un streak care numără zilele consecutive de
            practică și 25 de nivele prin care avatarul tău evoluează pe măsură ce progresezi.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studentFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link to="/tutoriale/elevi" className="gap-1">
              Tutoriale pentru elevi
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Pentru profesori */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Pentru profesori</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            PyRo îți oferă instrumentele unei săli de clasă digitale complete: creezi clase,
            îi înscrii pe elevi cu un cod de 6 caractere și le dai teste predefinite sau
            construite de tine, exercițiu cu exercițiu. Corectarea este automată — răspunsurile
            fixe sunt notate instant, iar programele scrise de elevi sunt evaluate cu AI, cu
            punctaj parțial. La final vezi statistici pe clasă și pe elev și exporți rapoarte
            în CSV sau PDF.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teacherFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link to="/tutoriale/profesori" className="gap-1">
              Tutoriale pentru profesori
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Întrebări frecvente</h2>
          <div className="mt-8 space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Descărcare */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold sm:text-3xl">Începe de pe telefon sau din browser</h2>
        <p className="mt-2 text-muted-foreground">
          Același cont, același progres — pe Android, iOS și web.
        </p>
        <AppDownloadCTA className="mt-6" />
      </section>
    </WebLayout>
  );
};

export default LandingPage;
