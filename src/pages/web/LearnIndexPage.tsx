import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BookOpen } from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import { Button } from "@/components/ui/button";
import { useSeoHead } from "@/hooks/useSeoHead";
import { learnChapters } from "@/data/learnChapters";

const LearnIndexPage = () => {
  useSeoHead({
    canonicalPath: "/invata",
    ogType: "website",
  });

  return (
    <WebLayout>
      <Helmet>
        <title>Învață Python gratuit — Lecții de programare pentru clasa a IX-a | PyRo</title>
        <meta
          name="description"
          content="Lecții gratuite de Python, în română, fără cont: variabile, condiții, bucle, liste, funcții, fișiere și interfețe grafice. Conținut aliniat programei de informatică pentru clasa a IX-a."
        />
      </Helmet>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Învață Python gratuit, pas cu pas
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Am publicat aici, în acces liber, teoria completă pe care o folosim în aplicația PyRo:
            șase capitole de programare în Python, în română, cu explicații și exemple de cod
            comentate. Poți citi totul fără cont și fără instalare — iar când vrei să exersezi
            cu exerciții interactive, aplicația te așteaptă.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {learnChapters.map((chapter) => (
            <Link
              key={chapter.slug}
              to={`/invata/${chapter.slug}`}
              className="group rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                Capitolul {chapter.number}
              </div>
              <h2 className="mt-2 text-lg font-semibold group-hover:text-primary">
                {chapter.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{chapter.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Citește capitolul
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border/60 bg-muted/20 p-6 text-center">
          <h2 className="text-xl font-semibold">Vrei să exersezi, nu doar să citești?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            În aplicația PyRo fiecare concept de mai sus are exerciții interactive, probleme de
            rezolvat în editorul din browser, XP și clasamente. Este gratuit.
          </p>
          <Button asChild className="mt-4 gap-2">
            <Link to="/auth">
              Creează cont gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </WebLayout>
  );
};

export default LearnIndexPage;
