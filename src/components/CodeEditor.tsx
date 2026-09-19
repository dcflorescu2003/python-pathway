import { useEffect, useRef, useState, useCallback } from "react";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { Sparkles } from "lucide-react";
import { python } from "@codemirror/lang-python";
import {
  indentUnit,
  defaultHighlightStyle,
  syntaxHighlighting as syntaxHighlightingFacet,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as editorPlaceholder,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
} from "@codemirror/view";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintKeymap } from "@codemirror/lint";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";

const AUTOCOMPLETE_STORAGE_KEY = "pyro_code_autocomplete";

/** Shared preference for code autocomplete in problem pages (persisted). */
export function useAutocompletePreference(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTOCOMPLETE_STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const set = useCallback((value: boolean) => {
    setOn(value);
    try {
      localStorage.setItem(AUTOCOMPLETE_STORAGE_KEY, value ? "on" : "off");
    } catch {
      /* ignore */
    }
  }, []);
  return [on, set];
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autocomplete?: boolean;
  /** When provided, a small toggle button is shown in the editor header. */
  onToggleAutocomplete?: (on: boolean) => void;
}

const pythonHighlighting = HighlightStyle.define([
  { tag: tags.keyword, color: "hsl(var(--accent))" },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: "hsl(var(--primary))" },
  { tag: [tags.string, tags.special(tags.string)], color: "hsl(var(--success))" },
  { tag: [tags.number, tags.bool, tags.null], color: "hsl(var(--warning))" },
  { tag: tags.comment, color: "hsl(var(--muted-foreground))", fontStyle: "italic" },
  { tag: [tags.operator, tags.punctuation], color: "hsl(var(--foreground))" },
  { tag: tags.variableName, color: "hsl(var(--foreground))" },
]);

const editorTheme = EditorView.theme({
  "&": {
    minHeight: "200px",
    height: "100%",
    color: "hsl(var(--foreground))",
    backgroundColor: "hsl(var(--background))",
    fontSize: "16px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    minHeight: "200px",
    overflow: "auto",
    fontFamily: "'Fira Code', monospace",
    lineHeight: "1.65",
  },
  ".cm-content": {
    minWidth: "max-content",
    padding: "12px 0",
    caretColor: "hsl(var(--primary))",
  },
  ".cm-line": { padding: "0 16px 0 8px" },
  ".cm-gutters": {
    color: "hsl(var(--muted-foreground))",
    backgroundColor: "hsl(var(--secondary) / 0.35)",
    borderRight: "1px solid hsl(var(--border))",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 10px 0 8px" },
  ".cm-activeLine": { backgroundColor: "hsl(var(--secondary) / 0.45)" },
  ".cm-activeLineGutter": {
    color: "hsl(var(--primary))",
    backgroundColor: "hsl(var(--secondary) / 0.7)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "hsl(var(--accent) / 0.25) !important",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "hsl(var(--primary))" },
  ".cm-matchingBracket": {
    color: "hsl(var(--primary))",
    backgroundColor: "hsl(var(--primary) / 0.16)",
    outline: "1px solid hsl(var(--primary) / 0.45)",
  },
  ".cm-placeholder": { color: "hsl(var(--muted-foreground) / 0.55)" },
  ".cm-indent-markers::before": { borderColor: "hsl(var(--border))" },
  "&.cm-editor.cm-readonly": { opacity: "0.65" },
});

const CodeEditor = ({
  value,
  onChange,
  disabled = false,
  placeholder,
  autocomplete = true,
  onToggleAutocomplete,
}: CodeEditorProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const editable = useRef(new Compartment());
  const autocompleteCompartment = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          foldGutter(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlightingFacet(defaultHighlightStyle, { fallback: true }),
          bracketMatching(),
          closeBrackets(),
          rectangularSelection(),
          crosshairCursor(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          keymap.of([
            ...closeBracketsKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
          ]),
          autocompleteCompartment.current.of(autocomplete ? autocompletion() : []),
          python(),
          indentUnit.of("    "),
          keymap.of([indentWithTab, ...defaultKeymap]),
          indentationMarkers({ highlightActiveBlock: true }),
          syntaxHighlighting(pythonHighlighting),
          editorTheme,
          editorPlaceholder(placeholder || "# Scrie codul tău Python aici..."),
          editable.current.of([
            EditorView.editable.of(!disabled),
            EditorState.readOnly.of(disabled),
          ]),
          EditorView.contentAttributes.of({
            spellcheck: "false",
            autocapitalize: "off",
            autocomplete: "off",
            autocorrect: "off",
            "aria-label": "Editor de cod Python",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor is created once; later prop changes are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === value) return;
    view.dispatch({ changes: { from: 0, to: currentValue.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: editable.current.reconfigure([
        EditorView.editable.of(!disabled),
        EditorState.readOnly.of(disabled),
      ]),
    });
  }, [disabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: autocompleteCompartment.current.reconfigure(
        autocomplete ? autocompletion() : []
      ),
    });
  }, [autocomplete]);

  return (
    <div
      data-code-editor
      className="relative overflow-hidden rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring/40"
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-warning/60" />
          <div className="h-3 w-3 rounded-full bg-primary/60" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">main.py</span>
        {onToggleAutocomplete && (
          <button
            type="button"
            onClick={() => onToggleAutocomplete(!autocomplete)}
            aria-pressed={autocomplete}
            title={autocomplete ? "Oprește sugestiile de cod" : "Pornește sugestiile de cod"}
            className={`ml-auto flex min-h-[40px] items-center gap-1.5 rounded-md px-2 font-mono text-xs transition-colors ${
              autocomplete
                ? "text-accent hover:bg-accent/10"
                : "text-muted-foreground/60 hover:bg-secondary"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sugestii {autocomplete ? "on" : "off"}
          </button>
        )}
      </div>
      <div ref={hostRef} className="min-h-[200px] max-h-[55vh] overflow-auto" />
    </div>
  );
};

export default CodeEditor;