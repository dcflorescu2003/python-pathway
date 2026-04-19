import { useRef, useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  language?: string;
  className?: string;
}

/**
 * Normalize pasted code:
 * - Convert tabs → 4 spaces.
 * - Detect & strip the smallest common leading-whitespace (dedent),
 *   so PyCharm copies that include extra indentation are preserved relatively.
 * - Trim trailing whitespace per line.
 */
const normalizePastedCode = (raw: string): string => {
  if (!raw) return raw;
  // Normalize line endings + tabs
  let text = raw.replace(/\r\n?/g, "\n").replace(/\t/g, "    ");

  const lines = text.split("\n");
  // Compute minimal indent across non-empty lines
  let minIndent = Infinity;
  for (const ln of lines) {
    if (!ln.trim()) continue;
    const m = /^( *)/.exec(ln);
    const len = m ? m[1].length : 0;
    if (len < minIndent) minIndent = len;
    if (minIndent === 0) break;
  }
  if (!isFinite(minIndent)) minIndent = 0;

  const dedented = lines.map((ln) => (ln.length >= minIndent ? ln.slice(minIndent) : ln).replace(/[ \t]+$/, ""));
  return dedented.join("\n").replace(/^\n+/, "").replace(/\n+$/, "\n");
};

const CodeBlockEditor = ({ value, onChange, placeholder, rows = 6, language = "python", className }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      e.preventDefault();
      const normalized = normalizePastedCode(text);
      const ta = ref.current;
      if (!ta) {
        onChange((value || "") + normalized);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + normalized + value.substring(end);
      onChange(next);
      setTimeout(() => {
        ta.focus();
        const pos = start + normalized.length;
        ta.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + "    " + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    },
    [value, onChange]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          💡 Copiezi cod din PyCharm? Indentarea se păstrează automat (tab-urile devin 4 spații).
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowPreview((p) => !p)}
        >
          {showPreview ? "Ascunde preview" : "Preview"}
        </Button>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "# Scrie cod Python aici..."}
        rows={rows}
        spellCheck={false}
        autoCapitalize="none"
        style={{ tabSize: 4 }}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {showPreview && value.trim() && (
        <div className="rounded-md border border-border overflow-hidden">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, fontSize: "0.85rem", background: "hsl(var(--muted) / 0.4)" }}
          >
            {value}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
};

export default CodeBlockEditor;
