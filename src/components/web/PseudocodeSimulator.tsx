import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { simulatePseudocode, type SimulationResult } from "@/lib/pseudocode/stepInterpreter";
import { type ScalarValue } from "@/lib/pseudocode/interpreter";
import { simulatorExamples } from "@/data/pseudocodeSimulatorExamples";
import PseudocodeStepEditor from "./PseudocodeStepEditor";

const formatValue = (value: ScalarValue | undefined) => value === undefined ? "—" : typeof value === "boolean" ? (value ? "adevărat" : "fals") : typeof value === "string" ? JSON.stringify(value) : String(value);

function Control({ label, onClick, disabled, primary, children }: { label: string; onClick: () => void; disabled?: boolean; primary?: boolean; children: React.ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>
    <Button aria-label={label} variant={primary ? "default" : "outline"} onClick={onClick} disabled={disabled} className="h-14 w-14 shrink-0 p-0">{children}</Button>
  </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}

export default function PseudocodeSimulator() {
  const initial = simulatorExamples[0];
  const [code, setCode] = useState(initial?.code ?? "");
  const [input, setInput] = useState(initial?.input ?? "");
  const [example, setExample] = useState(initial?.id ?? "");
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(800);
  const total = simulation?.frames.length ?? 0;
  const frame = position > 0 ? simulation?.frames[position - 1] : undefined;
  const previous = position > 1 ? simulation?.frames[position - 2] : undefined;
  const ended = simulation !== null && position === total;
  const error = ended ? simulation?.error : undefined;
  const inputValues = input.split("\n").map(value => value.trim()).filter(Boolean);
  const consumed = frame?.inputConsumed ?? 0;

  const invalidate = () => { setPlaying(false); setPosition(0); setSimulation(null); };
  const prepare = () => {
    const result = simulatePseudocode(code, input);
    setSimulation(result);
    return result;
  };
  const next = () => {
    setPlaying(false);
    const result = simulation ?? prepare();
    setPosition(current => Math.min(current + 1, result.frames.length));
  };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    const result = simulation ?? prepare();
    if (!result.frames.length) return;
    if (position >= result.frames.length) setPosition(0);
    setPlaying(true);
  };
  useEffect(() => {
    if (!playing) return;
    if (position >= total) { setPlaying(false); return; }
    const timer = setTimeout(() => setPosition(current => Math.min(current + 1, total)), delay);
    return () => clearTimeout(timer);
  }, [playing, position, total, delay]);

  return <div className="min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
      <div className="flex gap-2">
        <Control label="Resetează" onClick={() => { setPlaying(false); setPosition(0); }} disabled={position === 0 && !playing}><RotateCcw className="h-5 w-5" /></Control>
        <Control label="Pas înapoi" onClick={() => { setPlaying(false); setPosition(current => Math.max(0, current - 1)); }} disabled={position === 0}><ArrowLeft className="h-5 w-5" /></Control>
        <Control label={playing ? "Pauză" : "Rulează automat"} onClick={togglePlay} primary>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</Control>
        <Control label="Pas înainte" onClick={next} disabled={ended}><ArrowRight className="h-5 w-5" /></Control>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-60">
        <span className="text-sm text-muted-foreground">Viteză</span>
        <Slider aria-label="Viteză de rulare" className="h-14 flex-1" min={200} max={2000} step={100} value={[2200 - delay]} onValueChange={values => setDelay(2200 - (values[0] ?? 1400))} />
        <span className="w-16 text-right font-mono text-sm">{(delay / 1000).toFixed(1)} s</span>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <Select value={example} onValueChange={id => {
        const selected = simulatorExamples.find(item => item.id === id);
        if (!selected) return;
        invalidate(); setExample(id); setCode(selected.code); setInput(selected.input);
      }}>
        <SelectTrigger aria-label="Exemplu de algoritm" className="min-h-14 w-full text-base sm:w-80"><SelectValue placeholder="Algoritm personalizat" /></SelectTrigger>
        <SelectContent>{simulatorExamples.map(item => <SelectItem key={item.id} value={item.id} className="min-h-12 text-base">{item.title}</SelectItem>)}</SelectContent>
      </Select>
      <span role="status" className="font-mono text-sm text-muted-foreground">{simulation ? `Pas ${position} / ${total}` : "Pregătit"}{ended && !error ? " · Finalizat" : ""}</span>
    </div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-border">
        <div className="flex h-12 items-center justify-between bg-card px-4 font-mono text-sm">
          <h2>Algoritm</h2><span className="text-accent">{frame ? `Linia ${frame.line} executată` : "—"}</span>
        </div>
        <PseudocodeStepEditor code={code} line={frame?.line ?? 0} onChange={value => { if (value === code) return; setCode(value); setExample(""); invalidate(); }} />
        <div className="flex min-h-12 items-center border-t border-border bg-card px-4 font-mono text-sm text-muted-foreground">
          {frame?.condition !== undefined ? <>Condiție: <span className="ml-2 text-accent">{frame.condition ? "adevărată" : "falsă"}</span></> : frame ? `Instrucțiunea ${frame.line}` : "Stare inițială"}
        </div>
      </section>
      <div className="min-w-0">
        <section>
          <h2 className="mb-3 font-mono text-base text-accent">Variabile</h2>
          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full table-fixed text-left text-base">
              <thead className="sticky top-0 bg-card text-sm text-muted-foreground"><tr><th className="w-1/3 p-3 font-normal">Nume</th><th className="p-3 font-normal">Valoare</th></tr></thead>
              <tbody>{(simulation?.variableNames ?? []).map(name => {
                const value = frame?.variables[name];
                const old = previous?.variables[name];
                const changed = value !== undefined && !Object.is(value, old);
                return <tr key={name} className={`border-t border-border font-mono ${changed ? "bg-primary/10" : ""}`}>
                  <td className="break-all p-3">{name}</td>
                  <td className="break-all p-3"><span key={`${position}-${name}`} className={changed ? "text-primary motion-safe:animate-in motion-safe:fade-in" : "text-foreground"}>
                    {changed && <span className="mr-2 text-sm text-muted-foreground">{formatValue(old)} →</span>}<span data-variable={name}>{formatValue(value)}</span>
                  </span></td>
                </tr>;
              })}</tbody>
            </table>
            {!simulation?.variableNames.length && <div className="px-3 py-5 font-mono text-muted-foreground">—</div>}
          </div>
        </section>
        <section className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="simulation-input" className="mb-3 block font-mono text-base text-accent">Date de intrare</label>
            <textarea id="simulation-input" value={input} onChange={event => { setInput(event.target.value); invalidate(); }} rows={4} spellCheck={false} className="w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-base outline-none focus:border-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Citite: {consumed} / {inputValues.length}</p>
            {consumed > 0 && <div className="mt-1 max-h-24 overflow-auto break-all font-mono text-sm text-muted-foreground">{inputValues.slice(0, consumed).join(" · ")}</div>}
          </div>
          <div className="min-w-0"><h2 className="mb-3 font-mono text-base text-accent">Ieșire</h2>
            <pre aria-label="Ieșire simulator" className="max-h-52 min-h-36 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-card p-3 font-mono text-base text-primary">{frame?.output || "—"}</pre>
          </div>
        </section>
      </div>
    </div>
    {error && <p role="alert" className="mt-4 break-words border-l-2 border-destructive bg-destructive/10 p-4 text-base text-destructive">{error}</p>}
  </div>;
}