import { Check, X } from "lucide-react";

interface ReviewItem {
  answer_id: string;
  sort_order: number;
  score: number | null;
  max_points: number | null;
  feedback: string | null;
  answer_data: any;
  source_type: string;
  item_type: string | null;
  question: string | null;
  statement: string | null;
  options: any[] | null;
  correct_option_id: string | null;
  is_true: boolean | null;
  blanks: any[] | null;
  lines: any[] | null;
  correct_answer: string | null;
  code_template: string | null;
  explanation: string | null;
}

const scoreClass = (score: number, max: number) =>
  score >= max && max > 0
    ? "text-green-600"
    : score > 0
      ? "text-yellow-600"
      : "text-destructive";

const YourAnswer = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs pl-2 border-l-2 border-border">
    <div className="text-muted-foreground mb-0.5">Răspunsul tău:</div>
    <div className="text-foreground whitespace-pre-wrap break-words">{children}</div>
  </div>
);

const CorrectAnswer = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs pl-2 border-l-2 border-green-600/40">
    <div className="text-muted-foreground mb-0.5">Răspuns corect:</div>
    <div className="text-green-600 font-medium whitespace-pre-wrap break-words">{children}</div>
  </div>
);

const normalizeLoose = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim()
    .toLowerCase();

const splitAlternatives = (value: unknown): string[] => {
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  let quote: '"' | "'" | null = null;
  for (const ch of String(value ?? "")) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === "," || ch === "|" || ch === ";" || ch === "/")) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  parts.push(buf);
  return parts.map((p) => p.trim()).filter(Boolean);
};

const stripQuotes = (value: string) => {
  const t = value.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1);
  }
  return t;
};

export function SubmissionReviewRow({ item, index }: { item: ReviewItem; index: number }) {
  const score = Number(item.score ?? 0);
  const max = Number(item.max_points ?? 0);
  const isCorrect = max > 0 && score >= max;
  const cerinta = item.question || item.statement || `Exercițiul ${index + 1}`;
  const type = (item.item_type || "").toLowerCase();
  const ans = item.answer_data || {};
  const selectedOptionId = ans.selected_option_id ?? ans.selected ?? ans.answer;
  const selectedOptionIsCorrect = type === "quiz" && item.correct_option_id != null && normalizeLoose(selectedOptionId) === normalizeLoose(item.correct_option_id);
  const needsRegrade = max > 0 && score === 0 && selectedOptionIsCorrect;

  const renderBody = () => {
    // QUIZ
    if (type === "quiz" && Array.isArray(item.options)) {
      const selectedId = selectedOptionId;
      return (
        <div className="space-y-2">
          <YourAnswer>
            {item.options.find((opt: any) => normalizeLoose(opt.id) === normalizeLoose(selectedId))?.text ?? "—"}
          </YourAnswer>
          <CorrectAnswer>
            {item.options.find((opt: any) => normalizeLoose(opt.id) === normalizeLoose(item.correct_option_id))?.text ?? item.correct_option_id ?? "—"}
          </CorrectAnswer>
          {needsRegrade && (
            <div className="text-xs rounded-md border border-yellow-600/40 bg-yellow-500/10 px-2 py-1 text-yellow-700">
              Răspunsul este corect, dar punctajul vechi este 0. Profesorul trebuie să apese „Renotează”.
            </div>
          )}
          <div className="space-y-1 pl-2 border-l-2 border-border">
          {item.options.map((opt: any) => {
            const isSel = normalizeLoose(opt.id) === normalizeLoose(selectedId);
            const isCor = normalizeLoose(opt.id) === normalizeLoose(item.correct_option_id);
            const cls = isCor
              ? "text-green-600 font-medium"
              : isSel
                ? "text-destructive font-medium"
                : "text-muted-foreground";
            return (
              <div key={opt.id} className={`text-xs flex items-start gap-1.5 ${cls}`}>
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    isCor
                      ? "border-green-600 bg-green-500/10"
                      : isSel
                        ? "border-destructive bg-destructive/10"
                        : "border-border"
                  }`}
                >
                  {String(opt.id ?? "").toUpperCase()}
                </span>
                <span className="flex-1">{opt.text}</span>
                {isCor && <Check className="h-3.5 w-3.5 shrink-0" />}
                {isSel && !isCor && <X className="h-3.5 w-3.5 shrink-0" />}
              </div>
            );
          })}
          </div>
        </div>
      );
    }

    // TRUE / FALSE
    if (type === "truefalse") {
      const studentSel = ans.selected ?? ans.value ?? ans.answer;
      const studentBool =
        typeof studentSel === "boolean"
          ? studentSel
          : String(studentSel).toLowerCase() === "true" || studentSel === "a";
      const correct = item.is_true;
      return (
        <>
          {item.statement && item.question && (
            <div className="text-xs text-muted-foreground italic pl-2">{item.statement}</div>
          )}
          <YourAnswer>{studentSel == null ? "—" : studentBool ? "Adevărat" : "Fals"}</YourAnswer>
          {correct != null && (
            <CorrectAnswer>{correct ? "Adevărat" : "Fals"}</CorrectAnswer>
          )}
        </>
      );
    }

    // FILL
    if (type === "fill" && Array.isArray(item.blanks)) {
      const studentBlanks = ans.blanks || {};
      return (
        <div className="space-y-1.5">
          {item.blanks.map((b: any, i: number) => {
            const key = b.id ?? b.key ?? `b${i + 1}`;
            const given = studentBlanks[key];
            const correctVal = b.answer ?? "";
            const normalizedGiven = normalizeLoose(given).replace(/\s+/g, "");
            const accepted = splitAlternatives(correctVal).flatMap((part) => {
              const stripped = stripQuotes(part);
              return stripped === part.trim() ? [normalizeLoose(part).replace(/\s+/g, "")] : [normalizeLoose(part).replace(/\s+/g, ""), normalizeLoose(stripped).replace(/\s+/g, "")];
            });
            const ok = given != null && accepted.includes(normalizedGiven);
            return (
              <div
                key={key}
                className="text-xs pl-2 border-l-2 border-border grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5"
              >
                <span className="text-muted-foreground font-mono">{key}:</span>
                <span className={ok ? "text-green-600" : "text-destructive"}>
                  „{given ?? "—"}"
                </span>
                {!ok && (
                  <>
                    <span className="text-muted-foreground">corect:</span>
                    <span className="text-green-600 font-medium">„{correctVal}"</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // ORDER / REORDER
    if ((type === "order" || type === "reorder") && Array.isArray(item.lines)) {
      const studentOrder: string[] = Array.isArray(ans.order) ? ans.order : [];
      const linesById: Record<string, any> = {};
      for (const l of item.lines) linesById[l.id] = l;
      const correctOrder = [...item.lines]
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
        .map((l: any) => l.id);
      const textOf = (id: string) => linesById[id]?.text ?? id;
      const correctTexts = correctOrder.map(textOf);
      const studentTexts = studentOrder.map(textOf);
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="text-xs pl-2 border-l-2 border-border">
            <div className="text-muted-foreground mb-1">Ordinea ta:</div>
            <ol className="list-decimal list-inside space-y-0.5 font-mono">
              {studentOrder.length === 0
                ? <li className="list-none text-muted-foreground">—</li>
                : studentOrder.map((id, i) => {
                    const ok = correctOrder[i] === id || studentTexts[i] === correctTexts[i];
                    return (
                      <li key={i} className={ok ? "text-green-600" : "text-destructive"}>
                        {textOf(id)}
                      </li>
                    );
                  })}
            </ol>
          </div>
          <div className="text-xs pl-2 border-l-2 border-green-600/40">
            <div className="text-muted-foreground mb-1">Ordinea corectă:</div>
            <ol className="list-decimal list-inside space-y-0.5 font-mono text-green-600">
              {correctOrder.map((id, i) => (
                <li key={i}>{textOf(id)}</li>
              ))}
            </ol>
          </div>
        </div>
      );
    }

    // PROBLEM / CODE
    if (type === "problem" || ans.code) {
      const code = typeof ans === "string" ? ans : ans.code ?? "";
      return (
        <>
          <div className="text-xs pl-2 border-l-2 border-border">
            <div className="text-muted-foreground mb-0.5">Codul tău:</div>
            <pre className="bg-muted/50 rounded p-2 text-[11px] overflow-x-auto font-mono whitespace-pre">
              {code || "—"}
            </pre>
          </div>
        </>
      );
    }

    // OPEN / SHORT / fallback
    const text =
      typeof ans === "string"
        ? ans
        : ans.answer ?? ans.text ?? ans.value ?? ans.selected_option_text ?? null;
    return (
      <>
        <YourAnswer>
          {text != null ? String(text) : (
            <span className="text-muted-foreground">—</span>
          )}
        </YourAnswer>
        {item.correct_answer && !isCorrect && (
          <CorrectAnswer>{item.correct_answer}</CorrectAnswer>
        )}
      </>
    );
  };

  return (
    <div className="rounded-md bg-muted/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <pre className="text-xs text-foreground font-medium whitespace-pre-wrap flex-1 font-sans">
          {index + 1}. {cerinta}
        </pre>
        <span className={`text-xs font-semibold whitespace-nowrap ${scoreClass(score, max)}`}>
          {score}/{max}p
        </span>
      </div>

      {renderBody()}

      {item.feedback && (
        <p className="text-xs text-muted-foreground italic pl-2">💬 {item.feedback}</p>
      )}
    </div>
  );
}

export default SubmissionReviewRow;
