import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Pilcrow, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactMarkdown from "react-markdown";

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

const MarkdownEditor = ({ value, onChange, placeholder, rows = 6 }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const insert = (prefix: string, suffix: string = "") => {
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
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => insert("**", "**")}>
          <Bold className="h-4 w-4 mr-1" /> Bold
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insert("\n\n")}>
          <Pilcrow className="h-4 w-4 mr-1" /> Rând liber
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Palette className="h-4 w-4 mr-1" /> Culoare
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
        placeholder={placeholder}
        rows={rows}
      />

      {showPreview && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{value || "*Nimic de afișat*"}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
