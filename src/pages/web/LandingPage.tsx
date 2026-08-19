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

const LandingPage = () => {
  return (
    <WebLayout>
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

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold sm:text-3xl">Pentru elevi</h2>
        <p className="mt-2 text-muted-foreground">
          Înveți programare rezolvând, nu citind. Fiecare lecție se termină cu exerciții.
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
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Pentru profesori</h2>
          <p className="mt-2 text-muted-foreground">
            Gestionezi clasa, dai teste și urmărești progresul elevilor dintr-un singur loc.
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
