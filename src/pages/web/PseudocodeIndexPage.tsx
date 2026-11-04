import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, BookOpen, Code2, Terminal } from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import { Button } from "@/components/ui/button";
import { useSeoHead } from "@/hooks/useSeoHead";
import { pseudoLessons } from "@/data/pseudocodeLessons";
import { pseudoProblems, pseudoChapters } from "@/data/pseudocodeProblems";

const PseudocodeIndexPage = () => {
  useSeoHead({ canonicalPath: "/pseudocod", ogType: "website" });

  return (
    <WebLayout>
      <Helmet>
        <title>Pseudocod online — lecții și 30 de probleme rezolvate | PyRo</title>
        <meta
          name="description"
          content="Învață pseudocod gratuit: lecții pentru clasa a IX-a și 30 de probleme pe care le rulezi și le verifici direct în browser, cu interpretor de pseudocod în limba română."
        />
      </Helmet>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Pseudocod, pas cu pas</h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Înainte de Python, la clasa a IX-a algoritmii se scriu în pseudocod. Aici găsești lecții
            explicate, exemple pe care le poți rula și 30 de probleme cu verificare automată —
            totul gratuit, fără cont.
          </p>
          <Button asChild className="mt-6 min-h-[48px] gap-2">
            <Link to="/pseudocod/editor"><Terminal className="h-4 w-4" /> Deschide editorul liber</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-2xl font-semibold">Lecții</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {pseudoLessons.map((l) => (
            <Link
              key={l.slug}
              to={`/pseudocod/lectii/${l.slug}`}
              className="group rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <BookOpen className="h-4 w-4 text-primary" /> Lecția {l.number}
              </div>
              <h3 className="mt-2 text-lg font-semibold group-hover:text-primary">{l.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>
            </Link>
          ))}
        </div>

        {([1, 2] as const).map((ch) => (
          <div key={ch} className="mt-12">
            <h2 className="text-2xl font-semibold">
              Probleme — Capitolul {ch}: {pseudoChapters[ch].title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{pseudoChapters[ch].description}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {pseudoProblems.filter((p) => p.chapter === ch).map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/pseudocod/probleme/${p.slug}`}
                    className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-4 py-3 hover:border-primary/50"
                  >
                    <span className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-primary" /> {p.title}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{p.difficulty}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-12 rounded-xl border border-border/60 bg-muted/20 p-6 text-center">
          <h2 className="text-xl font-semibold">Gata cu pseudocodul? Treci la Python</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Aceiași algoritmi, scriși în Python, cu exerciții interactive, XP și clasamente în aplicația PyRo.
          </p>
          <Button asChild className="mt-4 min-h-[48px] gap-2">
            <Link to="/invata">Lecții de Python <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </WebLayout>
  );
};

export default PseudocodeIndexPage;
