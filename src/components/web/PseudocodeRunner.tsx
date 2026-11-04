import { useState } from "react";
import { Play, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { interpretPseudocode } from "@/lib/pseudocode/interpreter";
import { checkAgainstSolution, type CheckResult } from "@/lib/pseudocode/check";

interface Props {
  initialCode: string;
  initialInput?: string;
  rows?: number;
  /** Dacă sunt date, apare butonul „Verifică soluția”. */
  check?: { solution: string; tests: string[] };
}

const PseudocodeRunner = ({ initialCode, initialInput = "", rows = 10, check }: Props) => {
  const [code, setCode] = useState(initialCode);
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const run = () => {
    const r = interpretPseudocode(code, input);
    setIsError(!!r.error);
    setOutput(r.error ? `${r.output ? r.output + "\n" : ""}Eroare: ${r.error}` : r.output || "(nicio ieșire)");
  };

  const verify = () => {
    if (!check) return;
    setResult(checkAgainstSolution(code, check.solution, check.tests));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <span>pseudocod</span>
        <button
          type="button"
          onClick={() => { setCode(initialCode); setInput(initialInput); setOutput(null); setResult(null); }}
          className="inline-flex min-h-[32px] items-center gap-1 hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Resetează
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={rows}
        spellCheck={false}
        aria-label="Editor pseudocod"
        className="w-full resize-y bg-background p-3 font-mono text-sm leading-relaxed text-foreground outline-none"
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const t = e.currentTarget;
            const s = t.selectionStart;
            const next = code.slice(0, s) + "  " + code.slice(t.selectionEnd);
            setCode(next);
            requestAnimationFrame(() => t.setSelectionRange(s + 2, s + 2));
          }
        }}
      />
      <div className="grid gap-0 border-t border-border/60 sm:grid-cols-2">
        <label className="block border-b border-border/60 p-3 sm:border-b-0 sm:border-r">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Date de intrare (câte o valoare pe linie)
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            spellCheck={false}
            className="mt-1 w-full resize-y rounded-md bg-background p-2 font-mono text-sm outline-none"
          />
        </label>
        <div className="p-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Ieșire</span>
          <pre
            className={`mt-1 min-h-[76px] whitespace-pre-wrap rounded-md bg-background p-2 font-mono text-sm ${isError ? "text-destructive" : "text-primary"}`}
          >
            {output ?? "Apasă „Rulează”."}
          </pre>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border/60 p-3">
        <Button onClick={run} className="min-h-[48px] gap-2">
          <Play className="h-4 w-4" /> Rulează
        </Button>
        {check && (
          <Button onClick={verify} variant="outline" className="min-h-[48px] gap-2">
            <CheckCircle2 className="h-4 w-4" /> Verifică soluția
          </Button>
        )}
      </div>
      {result && (
        <div className="border-t border-border/60 p-3 text-sm">
          {result.passed === result.total ? (
            <p className="flex items-center gap-2 font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" /> Corect! Ai trecut toate cele {result.total} teste.
            </p>
          ) : (
            <div>
              <p className="flex items-center gap-2 font-medium text-destructive">
                <XCircle className="h-4 w-4" /> {result.passed} din {result.total} teste trecute.
              </p>
              {result.firstFail && (
                <div className="mt-2 grid gap-2 font-mono text-xs sm:grid-cols-3">
                  <div><div className="text-muted-foreground">Intrare</div><pre className="whitespace-pre-wrap">{result.firstFail.input}</pre></div>
                  <div><div className="text-muted-foreground">Așteptat</div><pre className="whitespace-pre-wrap">{result.firstFail.expected}</pre></div>
                  <div><div className="text-muted-foreground">Obținut</div><pre className="whitespace-pre-wrap">{result.firstFail.got || "(nimic)"}</pre></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PseudocodeRunner;
