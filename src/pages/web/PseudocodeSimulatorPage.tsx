import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import WebLayout from "@/components/web/WebLayout";
import { useSeoHead } from "@/hooks/useSeoHead";
import PseudocodeSimulator from "@/components/web/PseudocodeSimulator";

export default function PseudocodeSimulatorPage() {
  useSeoHead({ canonicalPath: "/pseudocod/simulator", ogType: "website" });
  return <WebLayout>
    <Helmet>
      <title>Simulator de pseudocod pas cu pas | PyRo</title>
      <meta name="description" content="Simulator de pseudocod în limba română: urmărește execuția algoritmilor pas cu pas, valorile variabilelor și rezultatele afișate." />
      <meta property="og:title" content="Simulator de pseudocod pas cu pas | PyRo" />
      <meta property="og:description" content="Urmărește execuția algoritmilor, valorile variabilelor și rezultatele afișate, pas cu pas." />
      <meta name="twitter:card" content="summary" />
    </Helmet>
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
      <Link to="/pseudocod" className="inline-flex min-h-12 items-center text-sm text-muted-foreground hover:text-foreground">← Pseudocod</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold sm:text-3xl">Simulator de pseudocod</h1>
      <PseudocodeSimulator />
    </main>
  </WebLayout>;
}