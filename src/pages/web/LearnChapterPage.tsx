import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import { Button } from "@/components/ui/button";
import { useSeoHead } from "@/hooks/useSeoHead";
import { learnChapters } from "@/data/learnChapters";
import { chapterTheories } from "@/data/chapterTheory";

const LearnChapterPage = () => {
  const { slug } = useParams();
  const chapter = learnChapters.find((c) => c.slug === slug);
  const theory = chapter
    ? chapterTheories.find((t) => t.chapterId === chapter.chapterId)
    : undefined;

  useSeoHead({
    canonicalPath: chapter ? `/invata/${chapter.slug}` : undefined,
    noindex: !chapter,
    ogType: "article",
  });

  if (!chapter || !theory) {
    return (
      <WebLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Capitol negăsit</h1>
          <p className="mt-2 text-muted-foreground">
            Capitolul căutat nu există sau a fost mutat.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/invata">Înapoi la lecții</Link>
          </Button>
        </div>
      </WebLayout>
    );
  }

  const index = learnChapters.indexOf(chapter);
  const prev = index > 0 ? learnChapters[index - 1] : undefined;
  const next = index < learnChapters.length - 1 ? learnChapters[index + 1] : undefined;

  return (
    <WebLayout>
      <Helmet>
        <title>{`${chapter.title} — Lecție gratuită de Python (Capitolul ${chapter.number}) | PyRo`}</title>
        <meta name="description" content={chapter.description} />
      </Helmet>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to="/invata">
            <ArrowLeft className="h-4 w-4" />
            Toate lecțiile
          </Link>
        </Button>

        <header className="mt-4">
          <p className="text-xs font-mono uppercase tracking-wider text-primary">
            Capitolul {chapter.number} · Lecție gratuită
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{chapter.title}</h1>
          <p className="mt-3 text-muted-foreground">{chapter.description}</p>
        </header>

        <div className="mt-10 space-y-10">
          {theory.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="flex items-center gap-3 text-xl font-semibold">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-mono font-bold text-primary-foreground">
                  {idx + 1}
                </span>
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.content.split("\n\n").map((paragraph, pIdx) => (
                  <p
                    key={pIdx}
                    className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.code && (
                <pre className="mt-4 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground sm:text-sm">
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-border/60 bg-muted/20 p-6 text-center">
          <h2 className="text-lg font-semibold">Exersează ce ai învățat</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Acest capitol are exerciții interactive și probleme de cod în aplicația PyRo — cu
            corectare automată și explicații. Gratuit, fără instalare.
          </p>
          <Button asChild className="mt-4 gap-2">
            <Link to="/auth">
              Începe exercițiile gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <nav className="mt-10 flex items-center justify-between gap-4 border-t border-border/60 pt-6">
          {prev ? (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to={`/invata/${prev.slug}`}>
                <ArrowLeft className="h-4 w-4" />
                {prev.title}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link to={`/invata/${next.slug}`}>
                {next.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </nav>
      </article>
    </WebLayout>
  );
};

export default LearnChapterPage;
