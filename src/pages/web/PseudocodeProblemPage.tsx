import AuthorNote from "@/components/web/AuthorNote";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Lightbulb, Eye } from "lucide-react";
import WebLayout from "@/components/web/WebLayout";
import { Button } from "@/components/ui/button";
import { useSeoHead } from "@/hooks/useSeoHead";
import PseudocodeRunner from "@/components/web/PseudocodeRunner";
import { pseudoProblems, getPseudoProblem, pseudoChapters } from "@/data/pseudocodeProblems";
import { interpretPseudocode } from "@/lib/pseudocode/interpreter";

const PseudocodeProblemPage = () => {
  const { slug } = useParams();
  const p = getPseudoProblem(slug);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  useSeoHead({ canonicalPath: p ? `/pseudocod/probleme/${p.slug}` : undefined, noindex: !p, ogType: "article" });

  if (!p) {
    return (
      <WebLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Problemă negăsită</h1>
          <Button asChild variant="outline" className="mt-6"><Link to="/pseudocod">Înapoi la pseudocod</Link></Button>
        </div>
      </WebLayout>
    );
  }

  const i = pseudoProblems.indexOf(p);
  const prev = pseudoProblems[i - 1];
  const next = pseudoProblems[i + 1];
  const exampleInput = p.tests[0];
  const exampleOutput = interpretPseudocode(p.solution, exampleInput).output;
  const starter = p.starter ?? "// Scrie algoritmul tău aici\n";

  return (
    <WebLayout>
      <Helmet>
        <title>{`${p.title} — problemă rezolvată în pseudocod | PyRo`}</title>
        <meta name="description" content={p.statement.slice(0, 155)} />
      </Helmet>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/pseudocod" className="text-sm text-muted-foreground hover:text-foreground">← Pseudocod</Link>
        <div className="mt-4 text-xs font-mono uppercase tracking-wider text-primary">
          Capitolul {p.chapter} · {pseudoChapters[p.chapter].title} · {p.difficulty}
        </div>
        <h1 className="mt-1 text-3xl font-bold">{p.title}</h1>
        <AuthorNote crumbs={[{ name: "Acasă", path: "/" }, { name: "Pseudocod", path: "/pseudocod" }, { name: p.title, path: `/pseudocod/probleme/${p.slug}` }]} headline={p.title} description={p.statement.slice(0, 155)} />

        <section className="mt-6 space-y-4 leading-relaxed">
          <h2 className="text-xl font-semibold">Enunț</h2>
          <p>{p.statement}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="font-semibold">Date de intrare</h3><p className="text-muted-foreground">{p.inputFormat}</p></div>
            <div><h3 className="font-semibold">Date de ieșire</h3><p className="text-muted-foreground">{p.outputFormat}</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <div className="text-xs font-mono uppercase text-muted-foreground">Exemplu intrare</div>
              <pre className="mt-1 font-mono text-sm">{exampleInput}</pre>
            </div>
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <div className="text-xs font-mono uppercase text-muted-foreground">Exemplu ieșire</div>
              <pre className="mt-1 font-mono text-sm text-primary">{exampleOutput}</pre>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Rezolvă aici</h2>
          <PseudocodeRunner initialCode={starter} initialInput={exampleInput} check={{ solution: p.solution, tests: p.tests }} />
        </section>

        <section className="mt-8 space-y-3">
          <Button variant="outline" className="min-h-[48px] gap-2" onClick={() => setShowHint((v) => !v)}>
            <Lightbulb className="h-4 w-4" /> {showHint ? "Ascunde indiciul" : "Arată un indiciu"}
          </Button>
          {showHint && <p className="rounded-lg border border-border/60 bg-muted/20 p-4">{p.hint}</p>}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Explicație</h2>
          {p.explanation.map((e, k) => <p key={k} className="mt-3 leading-relaxed text-foreground/90">{e}</p>)}
          <Button variant="outline" className="mt-4 min-h-[48px] gap-2" onClick={() => setShowSolution((v) => !v)}>
            <Eye className="h-4 w-4" /> {showSolution ? "Ascunde rezolvarea" : "Vezi rezolvarea"}
          </Button>
          {showSolution && (
            <pre className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-card p-4 font-mono text-sm text-primary">{p.solution}</pre>
          )}
        </section>

        <div className="mt-10 rounded-xl border border-border/60 bg-muted/20 p-5 text-sm">
          Vrei să scrii același algoritm în Python? Găsești teoria în{" "}
          <Link to="/invata" className="text-primary underline">lecțiile gratuite de Python</Link>.
        </div>

        <nav className="mt-10 flex flex-wrap justify-between gap-3">
          {prev ? (
            <Button asChild variant="outline" className="min-h-[48px] gap-2">
              <Link to={`/pseudocod/probleme/${prev.slug}`}><ArrowLeft className="h-4 w-4" /> {prev.title}</Link>
            </Button>
          ) : <span />}
          {next && (
            <Button asChild className="min-h-[48px] gap-2">
              <Link to={`/pseudocod/probleme/${next.slug}`}>{next.title} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          )}
        </nav>
      </article>
    </WebLayout>
  );
};

export default PseudocodeProblemPage;
