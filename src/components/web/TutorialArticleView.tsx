import { Helmet } from "react-helmet-async";
import { useSeoHead } from "@/hooks/useSeoHead";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Lightbulb } from "lucide-react";
import type { TutorialArticle } from "@/data/tutorials/types";
import AppDownloadCTA from "./AppDownloadCTA";

interface Props {
  articles: TutorialArticle[];
  basePath: string;
  audience: "Elevi" | "Profesori";
}

const TutorialArticleView = ({ articles, basePath, audience }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const currentIndex = articles.findIndex((a) => a.slug === slug);
  const article = currentIndex >= 0 ? articles[currentIndex] : undefined;
  const prev = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  useSeoHead({ canonicalPath: article ? `${basePath}/${article.slug}` : undefined });

  const handleNavClick = () => window.scrollTo({ top: 0, behavior: "auto" });

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Articol negăsit</h1>
        <p className="mt-2 text-muted-foreground">Tutorialul căutat nu există sau a fost mutat.</p>
        <Link
          to={basePath}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/10 px-5 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowLeft className="h-5 w-5" /> Înapoi la lista de tutoriale
        </Link>
      </div>
    );
  }

  const canonical = `https://pyroskill.info${basePath}/${article.slug}`;

  return (
    <>
      <Helmet>
        <title>{article.title} | PyRo</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={`${article.title} | PyRo`} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            author: { "@type": "Organization", name: "PyRo" },
            mainEntityOfPage: canonical,
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Despre", item: "https://pyroskill.info/about" },
              { "@type": "ListItem", position: 2, name: `Tutoriale ${audience}`, item: `https://pyroskill.info${basePath}` },
              { "@type": "ListItem", position: 3, name: article.title, item: canonical },
            ],
          })}
        </script>
      </Helmet>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link
          to={basePath}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/10 px-5 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowLeft className="h-5 w-5" /> Tutoriale {audience}
        </Link>

        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {article.durationMin} min de citit
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>
        </header>

        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={i} className="space-y-4">
              {section.heading && (
                <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
              )}
              {section.body.map((p, j) => (
                <p key={j} className="text-base leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))}
              {section.image && (
                <figure className="overflow-hidden rounded-lg border border-border bg-muted">
                  {section.image.src ? (
                    <img src={section.image.src} alt={section.image.alt} className="w-full" loading="lazy" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-muted-foreground">
                      {section.image.placeholder ?? section.image.alt}
                    </div>
                  )}
                  <figcaption className="border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
                    {section.image.alt}
                  </figcaption>
                </figure>
              )}
              {section.tip && (
                <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                  <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-foreground/90">{section.tip}</span>
                </div>
              )}
            </section>
          ))}
        </div>

        {(prev || next) && (
          <nav className="mt-12 grid gap-3 md:grid-cols-2" aria-label="Navigare tutoriale">
            {prev ? (
              <Link
                to={`${basePath}/${prev.slug}`}
                onClick={handleNavClick}
                className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" /> Articolul anterior
                </span>
                <span className="text-base font-semibold text-foreground group-hover:text-primary">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}
            {next ? (
              <Link
                to={`${basePath}/${next.slug}`}
                onClick={handleNavClick}
                className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-right transition-colors hover:border-primary hover:bg-primary/5 md:items-end"
              >
                <span className="flex items-center justify-end gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Articolul următor <ArrowRight className="h-4 w-4" />
                </span>
                <span className="text-base font-semibold text-foreground group-hover:text-primary">
                  {next.title}
                </span>
              </Link>
            ) : (
              <div className="hidden md:block" />
            )}
          </nav>
        )}

        <div className="mt-12 rounded-lg border border-border bg-card p-6 text-center">
          <h3 className="text-xl font-semibold">Gata să încerci?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Descarcă aplicația sau intră direct din browser.
          </p>
          <AppDownloadCTA className="mt-4 justify-center" />
        </div>
      </article>
    </>
  );
};

export default TutorialArticleView;
