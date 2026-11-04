import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import WebLayout from "@/components/web/WebLayout";
import { useSeoHead } from "@/hooks/useSeoHead";
import PseudocodeRunner from "@/components/web/PseudocodeRunner";

const EXAMPLE = `// Suma numerelor de la 1 la n
citeste n
suma <- 0
pentru i <- 1, n executa
  suma <- suma + i
sfarsit pentru
scrie "Suma este", suma`;

const PseudocodeEditorPage = () => {
  useSeoHead({ canonicalPath: "/pseudocod/editor", ogType: "website" });
  return (
    <WebLayout>
      <Helmet>
        <title>Editor de pseudocod online — rulează algoritmi în browser | PyRo</title>
        <meta name="description" content="Interpretor de pseudocod în limba română: scrie și rulează algoritmi cu citeste, scrie, daca, cat timp, pentru și repeta, direct în browser." />
      </Helmet>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link to="/pseudocod" className="text-sm text-muted-foreground hover:text-foreground">← Pseudocod</Link>
        <h1 className="mt-3 text-3xl font-bold">Editor de pseudocod</h1>
        <p className="mt-2 text-muted-foreground">
          Scrie orice algoritm și rulează-l. Instrucțiuni recunoscute: citeste, scrie, atribuire cu &lt;-,
          daca…atunci…altfel…sfarsit daca, cat timp…executa…sfarsit cat timp, pentru i &lt;- a, b executa…sfarsit pentru,
          repeta…pana cand, operatorii div, mod, si, sau, nu și partea întreagă [x].
        </p>
        <div className="mt-6">
          <PseudocodeRunner initialCode={EXAMPLE} initialInput="10" rows={16} />
        </div>
      </div>
    </WebLayout>
  );
};

export default PseudocodeEditorPage;
