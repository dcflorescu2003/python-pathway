import { jsPDF } from "jspdf";

/* ---------------- Font loading (Unicode / diacritice românești) ---------------- */

const FONTS = [
  { file: "/fonts/DejaVuSans.ttf", vfs: "DejaVuSans.ttf", name: "DejaVu", style: "normal" },
  { file: "/fonts/DejaVuSans-Bold.ttf", vfs: "DejaVuSans-Bold.ttf", name: "DejaVu", style: "bold" },
  { file: "/fonts/DejaVuSansMono.ttf", vfs: "DejaVuSansMono.ttf", name: "DejaVuMono", style: "normal" },
];

let fontCache: Record<string, string> | null = null;

async function loadFonts(): Promise<Record<string, string>> {
  if (fontCache) return fontCache;
  const entries = await Promise.all(
    FONTS.map(async (f) => {
      const res = await fetch(f.file);
      if (!res.ok) throw new Error(`Nu s-a putut încărca fontul ${f.file}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) {
        binary += String.fromCharCode(...buf.subarray(i, i + chunk));
      }
      return [f.vfs, btoa(binary)] as const;
    })
  );
  fontCache = Object.fromEntries(entries);
  return fontCache;
}

/* ---------------- Types ---------------- */

interface PdfTest {
  title: string;
  description?: string | null;
  difficulty?: string | null;
  time_limit_minutes?: number | null;
  variant_mode?: string | null;
}

interface PdfItem {
  variant: string;
  sort_order: number;
  source_type: string;
  source_id: string | null;
  custom_data: any;
  points: number;
}

const TYPE_LABELS: Record<string, string> = {
  quiz: "Grilă",
  truefalse: "Adevărat/Fals",
  fill: "Completare",
  order: "Ordonare",
  code: "Cod",
  problem: "Problemă",
  open_answer: "Răspuns deschis",
};

/* ---------------- Helpers ---------------- */

function stripMarkup(text: unknown): string {
  return String(text ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function slugify(text: string): string {
  return (
    stripMarkup(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "test"
  );
}

/* ---------------- Export ---------------- */

export async function exportTestToPdf(
  test: PdfTest,
  items: PdfItem[],
  resolveExercise: (item: PdfItem) => any | null
): Promise<void> {
  const fonts = await loadFonts();

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  for (const f of FONTS) {
    doc.addFileToVFS(f.vfs, fonts[f.vfs]);
    doc.addFont(f.vfs, f.name, f.style);
  }

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 15;
  const CONTENT_W = PAGE_W - M * 2;
  let y = M;

  const setFont = (variant: "normal" | "bold" | "mono", size: number) => {
    if (variant === "mono") doc.setFont("DejaVuMono", "normal");
    else doc.setFont("DejaVu", variant);
    doc.setFontSize(size);
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - M) {
      doc.addPage();
      y = M;
    }
  };

  const writeText = (
    text: string,
    opts: { size?: number; variant?: "normal" | "bold" | "mono"; indent?: number; color?: [number, number, number]; gap?: number } = {}
  ) => {
    const { size = 10, variant = "normal", indent = 0, color = [30, 30, 30], gap = 1.5 } = opts;
    setFont(variant, size);
    doc.setTextColor(...color);
    const lineH = size * 0.42 + 1.1;
    const lines = doc.splitTextToSize(text || "", CONTENT_W - indent) as string[];
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, M + indent, y + lineH * 0.75);
      y += lineH;
    }
    y += gap;
  };

  const writeCode = (code: string, indent = 4) => {
    const size = 8.5;
    setFont("mono", size);
    const lineH = 4.2;
    const raw = String(code ?? "").replace(/\t/g, "    ").split("\n");
    const lines = raw.flatMap((l) => doc.splitTextToSize(l || " ", CONTENT_W - indent - 4) as string[]);
    for (const line of lines) {
      ensureSpace(lineH);
      doc.setFillColor(244, 245, 247);
      doc.rect(M + indent, y, CONTENT_W - indent, lineH, "F");
      setFont("mono", size);
      doc.setTextColor(40, 40, 40);
      doc.text(line, M + indent + 2, y + lineH * 0.72);
      y += lineH;
    }
    y += 2;
  };

  const writeAnswerLine = (text: string, correct: boolean, indent = 5) => {
    writeText(`${correct ? "[✔] " : "[  ] "}${text}`, {
      size: 10,
      variant: correct ? "bold" : "normal",
      indent,
      color: correct ? [16, 110, 60] : [55, 55, 55],
      gap: 0.6,
    });
  };

  const divider = () => {
    ensureSpace(4);
    doc.setDrawColor(215, 218, 222);
    doc.setLineWidth(0.2);
    doc.line(M, y, PAGE_W - M, y);
    y += 4;
  };

  /* ---- Header ---- */
  writeText(stripMarkup(test.title), { size: 17, variant: "bold", color: [15, 18, 25], gap: 1 });
  const meta: string[] = [];
  if (test.difficulty) meta.push(`Dificultate: ${test.difficulty}`);
  if (test.time_limit_minutes) meta.push(`Timp: ${test.time_limit_minutes} min`);
  const totalPoints = items.reduce((s, i) => s + (i.points || 0), 0);
  meta.push(`Total: ${totalPoints} puncte`);
  meta.push(`Itemi: ${items.length}`);
  writeText(meta.join("  •  "), { size: 9.5, color: [110, 115, 125] });
  if (test.description) writeText(stripMarkup(test.description), { size: 10, color: [70, 75, 85] });
  divider();

  /* ---- Item groups (variants) ---- */
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const isManual = test.variant_mode === "manual";
  const groups: { label: string | null; items: PdfItem[] }[] = isManual
    ? [
        { label: "Varianta A (Nr. 1)", items: sorted.filter((i) => i.variant === "A" || i.variant === "both") },
        { label: "Varianta B (Nr. 2)", items: sorted.filter((i) => i.variant === "B" || i.variant === "both") },
      ].filter((g) => g.items.length > 0)
    : [{ label: null, items: sorted }];

  if (sorted.length === 0) {
    writeText("Acest test nu conține itemi.", { size: 11, color: [120, 120, 120] });
  }

  groups.forEach((group, gIdx) => {
    if (group.label) {
      if (gIdx > 0) {
        doc.addPage();
        y = M;
      }
      ensureSpace(12);
      doc.setFillColor(15, 18, 25);
      doc.rect(M, y, CONTENT_W, 8, "F");
      setFont("bold", 11);
      doc.setTextColor(255, 255, 255);
      doc.text(group.label, M + 3, y + 5.6);
      y += 12;
    }

    group.items.forEach((item, idx) => {
      const ex = resolveExercise(item);
      ensureSpace(18);

      const type = ex?.type || item.source_type;
      const typeLabel = TYPE_LABELS[type] || type || "Item";
      writeText(`${idx + 1}. ${typeLabel} — ${item.points} puncte`, {
        size: 11,
        variant: "bold",
        color: [20, 90, 160],
        gap: 1,
      });

      if (!ex) {
        writeText("Item indisponibil (sursă ștearsă).", { size: 10, color: [160, 60, 60] });
        divider();
        return;
      }

      const question = stripMarkup(ex.question || ex.statement || ex.title || "");
      if (question) writeText(question, { size: 10.5, indent: 3 });

      const codeTemplate = ex.code_template || ex.codeTemplate;

      if (type === "quiz") {
        if (codeTemplate) writeCode(codeTemplate);
        const options = (ex.options || []) as { id: string; text: string }[];
        const correctId = ex.correct_option_id ?? ex.correctOptionId;
        options.forEach((opt, i) => {
          const letter = String.fromCharCode(97 + i);
          writeAnswerLine(`${letter}) ${stripMarkup(opt.text)}`, String(opt.id) === String(correctId));
        });
        y += 1.5;
      } else if (type === "truefalse") {
        if (codeTemplate) writeCode(codeTemplate);
        const isTrue = ex.is_true ?? ex.isTrue;
        writeAnswerLine("Adevărat", isTrue === true);
        writeAnswerLine("Fals", isTrue === false);
        y += 1.5;
      } else if (type === "fill") {
        if (codeTemplate) writeCode(codeTemplate);
        const blanks = (ex.blanks || []) as { id: string; answer: string }[];
        writeText("Răspunsuri corecte:", { size: 9.5, variant: "bold", indent: 3, color: [16, 110, 60], gap: 0.8 });
        blanks.forEach((b, i) => {
          writeText(`Spațiu ${i + 1}: ${b.answer}`, {
            size: 10,
            variant: "bold",
            indent: 6,
            color: [16, 110, 60],
            gap: 0.6,
          });
        });
        y += 1.5;
      } else if (type === "order") {
        const lines = ((ex.lines || []) as { id: string; text: string; order?: number }[])
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        writeText("Ordinea corectă:", { size: 9.5, variant: "bold", indent: 3, color: [16, 110, 60], gap: 0.8 });
        writeCode(lines.map((l, i) => `${i + 1}. ${l.text}`).join("\n"), 6);
      } else {
        // cod / problemă / răspuns deschis / fallback
        if (codeTemplate) writeCode(codeTemplate);
        const testCases = ex.test_cases;
        if (testCases) {
          const tcText =
            typeof testCases === "string"
              ? testCases
              : Array.isArray(testCases)
                ? testCases
                    .map((tc: any) =>
                      typeof tc === "string" ? tc : `stdin: ${tc.stdin ?? tc.input ?? ""}\nstdout: ${tc.stdout ?? tc.expected ?? ""}`
                    )
                    .join("\n---\n")
                : JSON.stringify(testCases, null, 2);
          if (tcText.trim()) {
            writeText("Cazuri de test:", { size: 9.5, variant: "bold", indent: 3, color: [90, 95, 105], gap: 0.8 });
            writeCode(tcText, 6);
          }
        }
        const solution = ex.solution || ex.expected_answer || ex.answer;
        if (solution) {
          writeText("Răspuns corect / soluție de referință:", {
            size: 9.5,
            variant: "bold",
            indent: 3,
            color: [16, 110, 60],
            gap: 0.8,
          });
          writeCode(String(solution), 6);
        }
      }

      if (ex.explanation) {
        writeText(`Explicație: ${stripMarkup(ex.explanation)}`, { size: 9, indent: 3, color: [110, 115, 125] });
      }

      divider();
    });
  });

  /* ---- Footer: page numbers ---- */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setFont("normal", 8);
    doc.setTextColor(150, 152, 158);
    doc.text(`${stripMarkup(test.title)} — barem`, M, PAGE_H - 8);
    doc.text(`Pagina ${p} / ${pageCount}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
  }

  doc.save(`${slugify(test.title)}.pdf`);
}
