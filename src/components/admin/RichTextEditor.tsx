import { useRef, useState, useCallback } from "react";
import TurndownService from "turndown";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Pilcrow, Palette, Code2, Code, Eraser } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import RichContent from "@/components/RichContent";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const COLORS = [
  { name: "Roșu", value: "red" },
  { name: "Verde", value: "green" },
  { name: "Albastru", value: "blue" },
  { name: "Portocaliu", value: "orange" },
  { name: "Mov", value: "purple" },
];

// Singleton turndown configured for Word/Docs HTML
const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

// Preserve inline color spans (Word emits style="color:..." or color attr)
turndown.addRule("colorSpan", {
  filter: (node: any) => {
    if (node.nodeName !== "SPAN") return false;
    const style = (node.getAttribute("style") || "").toLowerCase();
    return /color\s*:/.test(style);
  },
  replacement: (content: string, node: any) => {
    const style = node.getAttribute("style") || "";
    const m = /color\s*:\s*([^;]+)/i.exec(style);
    const color = m ? m[1].trim() : "inherit";
    return `<span style="color:${color}">${content}</span>`;
  },
});

// Strip MS Word's <o:p>, mso classes, and empty spans
turndown.addRule("stripWordCruft", {
  filter: (node: any) =>
    node.nodeName === "O:P" ||
    (node.nodeName === "SPAN" && !(node.getAttribute("style") || "").length && !node.textContent?.trim()),
  replacement: () => "",
});

const RichTextEditor = ({ value, onChange, placeholder, rows = 6 }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const insert = useCallback(
    (prefix: string, suffix: string = "") => {
      const ta = ref.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.substring(start, end) || "text";
      const newVal = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
      onChange(newVal);
      setTimeout(() => {
        ta.focus();
        const cursorPos = start + prefix.length + selected.length + suffix.length;
        ta.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    },
    [value, onChange]
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = ref.current;
      if (!ta) {
        onChange(value + text);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + text + value.substring(end);
      onChange(newVal);
      setTimeout(() => {
        ta.focus();
        const pos = start + text.length;
        ta.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData.getData("text/html");
      if (!html) return; // let plain text paste work normally
      e.preventDefault();
      try {
        // Strip MS Office wrapper conditional comments that confuse turndown
        const cleaned = html
          .replace(/<!--\[if[\s\S]*?endif\]-->/gi, "")
          .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")
          .replace(/<o:p\s*\/>/gi, "");
        const md = turndown.turndown(cleaned).trim();
        insertAtCursor(md);
      } catch {
        insertAtCursor(e.clipboardData.getData("text/plain"));
      }
    },
    [insertAtCursor]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "b") { e.preventDefault(); insert("**", "**"); }
      else if (key === "i") { e.preventDefault(); insert("*", "*"); }
      else if (key === "k") { e.preventDefault(); insert("`", "`"); }
      else if (key === "l") { e.preventDefault(); insert("\n- "); }
      else if (e.key === "Enter") { e.preventDefault(); insert("\n\n"); }
    },
    [insert]
  );

  const stripFormatting = useCallback(() => {
    let t = value;
    // Remove fenced code blocks (keep content)
    t = t.replace(/```[\w]*\n?([\s\S]*?)```/g, "$1");
    // Remove HTML tags
    t = t.replace(/<[^>]+>/g, "");
    // Remove images and links (keep link text)
    t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
    t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    // Remove bold/italic markers
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
    t = t.replace(/__([^_]+)__/g, "$1");
    t = t.replace(/\*([^*]+)\*/g, "$1");
    t = t.replace(/_([^_]+)_/g, "$1");
    // Remove inline code backticks
    t = t.replace(/`([^`]+)`/g, "$1");
    // Strip heading hashes and blockquote markers at line start
    t = t.replace(/^[ \t]{0,3}(#{1,6}|>)\s+/gm, "");
    // Convert list markers to plain
    t = t.replace(/^[ \t]*[-*+]\s+/gm, "");
    t = t.replace(/^[ \t]*\d+\.\s+/gm, "");
    // Collapse 3+ blank lines
    t = t.replace(/\n{3,}/g, "\n\n");
    onChange(t.trim());
  }, [value, onChange]);


  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => insert("**", "**")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insert("*", "*")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insert("\n- ")} title="Listă (Ctrl+L)">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insert("\n\n")} title="Rând liber (Ctrl+Enter)">
          <Pilcrow className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insert("`", "`")} title="Cod inline (Ctrl+K)">
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insert("\n```python\n", "\n```\n")}
          title="Bloc cod Python"
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" title="Culoare">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className="w-7 h-7 rounded-full border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                  onClick={() => insert(`<span style="color:${c.value}">`, "</span>")}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={stripFormatting}
          title="Curăță formatare (păstrează doar text)"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto text-xs"
          onClick={() => setShowPreview((p) => !p)}
        >
          {showPreview ? "Ascunde preview" : "Preview"}
        </Button>
      </div>

      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
      />

      <p className="text-[11px] text-muted-foreground">
        💡 Poți face <strong>copy-paste din Word</strong> — formatarea (bold, italic, liste, culori) se păstrează automat.
      </p>

      {showPreview && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <RichContent>{value || "*Nimic de afișat*"}</RichContent>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
