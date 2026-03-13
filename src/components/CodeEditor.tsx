import { cn } from "@/lib/utils";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CodeEditor = ({ value, onChange, disabled, placeholder }: CodeEditorProps) => {
  return (
    <div className="relative rounded-lg border border-border overflow-hidden bg-background">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-primary/60" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">main.py</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || "# Scrie codul tău Python aici..."}
        spellCheck={false}
        className={cn(
          "w-full min-h-[200px] p-4 font-mono text-sm bg-background text-foreground",
          "resize-y outline-none placeholder:text-muted-foreground/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "leading-relaxed"
        )}
        style={{ tabSize: 4 }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newValue = value.substring(0, start) + "    " + value.substring(end);
            onChange(newValue);
            requestAnimationFrame(() => {
              e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
            });
          }
        }}
      />
    </div>
  );
};

export default CodeEditor;
