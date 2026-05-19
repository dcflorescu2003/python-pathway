import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Code2,
  Trophy,
  Heart,
  Target,
  Users,
  FileText,
  BrainCircuit,
  BarChart3,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import FeatureCard from "@/components/web/FeatureCard";
import AppDownloadCTA from "@/components/web/AppDownloadCTA";
import PyroLogo from "@/components/brand/PyroLogo";
import { Button } from "@/components/ui/button";

const studentFeatures = [
  { icon: BookOpen, title: "Lecții interactive scurte", description: "6 capitole, 60 de probleme. Lecții scurte, exerciții variate, progres rapid." },
  { icon: Code2, title: "Editor Python în browser", description: "Codul tău rulează direct în browser cu Pyodide. Zero setup, zero instalări." },
  { icon: Target, title: "XP, nivele și avatar", description: "25 de nivele și un avatar șarpe Python care evoluează prin 10 stadii." },
  { icon: Heart, title: "Vieți și streak zilnic", description: "5 vieți care se regenerează. Streak pentru zilele consecutive de practică." },
  { icon: Trophy, title: "Clasamente", description: "Compară-te cu colegii din școală, oraș sau la nivel național." },
  { icon: Sparkles, title: "Provocări de la profesor", description: "Primești teste și provocări direct de la profesorul tău, cu notificare." },
];

const teacherFeatures = [
  { icon: Users, title: "Clase și roster elevi", description: "Creezi clase, generezi cod de înrolare, urmărești elevii cu numele real." },
  { icon: FileText, title: "Teste predefinite + custom", description: "Folosește Eval Bank sau construiește teste cu propriile exerciții." },
  { icon: BrainCircuit, title: "Statistici pentru clasă", description: "Răspunsurile fixe se notează instant. Codul liber e evaluat de Gemini." },
  { icon: BarChart3, title: "Analitice clasă", description: "Grafice de performanță, export CSV / PDF pentru rapoarte." },
  { icon: GraduationCap, title: "Profil de competențe", description: "Urmărește competențele generale, specifice și microcompetențele per elev." },
];

const AboutPage = () => {
  return (
    <WebLayout>
      <Helmet>
        <title>PyRo — Învață Python pas cu pas, pentru elevi și profesori</title>
        <meta
          name="description"
          content="PyRo este platforma educațională care învață Python prin lecții interactive. Curriculum aliniat cu clasa a IX-a, editor de cod în browser, unelte complete pentru profesori."
        />
        <link rel="canonical" href="https://pyroskill.info/about" />
        <meta property="og:title" content="PyRo — Învață Python pas cu pas" />
        <meta property="og:description" content="Platformă educațională Python pentru elevi și profesori. Lecții, teste, AI grading și analitice." />
        <meta property="og:url" content="https://pyroskill.info/about" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "PyRo",
            url: "https://pyroskill.info",
            description: "Platformă educațională pentru învățarea Python, dedicată elevilor de liceu și profesorilor de informatică.",
          })}
        </script>
      </Helmet>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <PyroLogo size="xl" showWordmark={false} />
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Învață <span className="text-gradient-primary">Python</span> pas cu pas
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            PyRo este aplicația care transformă învățarea Python într-un joc. Pentru elevi de liceu,
            pentru profesori de informatică și pentru oricine vrea să înceapă cu programarea.
          </p>
          <AppDownloadCTA className="justify-center" />
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Aliniat cu programa de clasa a IX-a</span>
            <span aria-hidden>·</span>
            <span>Rulează direct în browser</span>
            <span aria-hidden>·</span>
            <span>Gratuit pentru a începe</span>
          </div>
        </div>
      </section>

      {/* Ce este PyRo */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ce este PyRo?</h2>
            <p className="mt-4 text-muted-foreground">
              Este o platformă educațională cu lecții interactive scurte, construită special pentru limbajul Python.
              Acoperă întreaga programă de informatică pentru clasa a IX-a, dar funcționează la fel de
              bine pentru oricine vrea să învețe Python de la zero.
            </p>
            <p className="mt-3 text-muted-foreground">
              Pe lângă lecții, PyRo oferă o suită completă de unelte pentru profesori: clase, teste,
              notare cu AI și analitice detaliate pe elevi.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-primary">$</span> python lecție.py
              </div>
              <pre className="rounded-md bg-muted p-4 text-xs leading-relaxed">
{`def salut(nume):
    return f"Salut, {nume}!"

print(salut("PyRo"))
# Salut, PyRo!`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Toate exercițiile rulează în browser, fără instalări.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilități elevi */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Pentru elevi</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Învață jucându-te</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/tutoriale/elevi" className="gap-2">
                Tutoriale elevi <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {studentFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Facilități profesori */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Pentru profesori</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Instrumente utile pentru clasă</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/tutoriale/profesori" className="gap-2">
                Tutoriale profesori <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacherFeatures.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Cum funcționează */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Cum funcționează
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { n: "01", title: "Îți creezi cont", text: "Înregistrare gratuită cu email, Google sau Apple. Alegi școala din listă." },
              { n: "02", title: "Începi lecțiile", text: "Parcurgi capitolele în ritmul tău. Câștigi XP, urci în nivel, păstrezi streak-ul." },
              { n: "03", title: "Profesorul te susține", text: "Dacă ești într-o clasă, primești teste și provocări personalizate direct în app." },
            ].map((step) => (
              <div key={step.n} className="relative rounded-xl border border-border bg-card p-6">
                <div className="mb-3 font-mono text-3xl font-bold text-primary/30">{step.n}</div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Începe astăzi</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Descarcă PyRo pe telefon sau deschide aplicația direct în browser. Gratuit, fără card.
          </p>
          <AppDownloadCTA className="mt-8 justify-center" />
        </div>
      </section>
    </WebLayout>
  );
};

export default AboutPage;
