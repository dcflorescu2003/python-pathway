import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import { Button } from "@/components/ui/button";
import { useSeoHead } from "@/hooks/useSeoHead";
import PseudocodeRunner from "@/components/web/PseudocodeRunner";
import { pseudoLessons, getPseudoLesson } from "@/data/pseudocodeLessons";

const PseudocodeLessonPage = () => {
  const { slug } = useParams();
  const lesson = getPseudoLesson(slug);
  useSeoHead({ canonicalPath: lesson ? `/pseudocod/lectii/${lesson.slug}` : undefined, noindex: !lesson, ogType: "article" });

  if (!lesson) {
    return (
      <WebLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Lecție negăsită</h1>
          <Button asChild variant="outline" className="mt-6"><Link to="/pseudocod">Înapoi la pseudocod</Link></Button>
        </div>
      </WebLayout>
    );
  }
  const i = pseudoLessons.indexOf(lesson);
  const prev = pseudoLessons[i - 1];
  const next = pseudoLessons[i + 1];

  return (
    <WebLayout>
      <Helmet>
        <title>{`${lesson.title} — Lecția ${lesson.number} de pseudocod | PyRo`}</title>
        <meta name="description" content={lesson.description} />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/pseudocod" className="text-sm text-muted-foreground hover:text-foreground">← Pseudocod</Link>
        <div className="mt-4 text-xs font-mono uppercase tracking-wider text-primary">Lecția {lesson.number}</div>
        <h1 className="mt-1 text-3xl font-bold">{lesson.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{lesson.description}</p>

        {lesson.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-xl font-semibold">{s.heading}</h2>
            {s.paragraphs.map((p, k) => (
              <p key={k} className="mt-3 leading-relaxed text-foreground/90">{p}</p>
            ))}
            {s.code && (
              <div className="mt-4">
                <PseudocodeRunner initialCode={s.code} initialInput={s.input} rows={Math.min(14, s.code.split("\n").length + 1)} />
              </div>
            )}
          </section>
        ))}

        <nav className="mt-12 flex flex-wrap justify-between gap-3">
          {prev ? (
            <Button asChild variant="outline" className="min-h-[48px] gap-2">
              <Link to={`/pseudocod/lectii/${prev.slug}`}><ArrowLeft className="h-4 w-4" /> {prev.title}</Link>
            </Button>
          ) : <span />}
          {next ? (
            <Button asChild className="min-h-[48px] gap-2">
              <Link to={`/pseudocod/lectii/${next.slug}`}>{next.title} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          ) : (
            <Button asChild className="min-h-[48px] gap-2">
              <Link to="/pseudocod">Rezolvă probleme <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          )}
        </nav>
      </article>
    </WebLayout>
  );
};

export default PseudocodeLessonPage;
