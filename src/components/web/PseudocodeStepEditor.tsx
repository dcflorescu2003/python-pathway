import { useEffect, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";

const markLine = StateEffect.define<number>();
const executionLine = StateField.define({
  create: () => Decoration.none,
  update(decorations, transaction) {
    if (transaction.docChanged) return Decoration.none;
    for (const effect of transaction.effects) {
      if (!effect.is(markLine)) continue;
      if (effect.value < 1 || effect.value > transaction.state.doc.lines) return Decoration.none;
      const line = transaction.state.doc.line(effect.value);
      return Decoration.set([Decoration.line({ attributes: { class: "bg-primary/15 border-l-2 border-primary", "data-execution-line": String(effect.value) } }).range(line.from)]);
    }
    return decorations;
  },
  provide: field => EditorView.decorations.from(field),
});

const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "16px", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { overflow: "auto", fontFamily: "'Fira Code', monospace", lineHeight: "1.75" },
  ".cm-content": { padding: "12px 0", caretColor: "hsl(var(--primary))" },
  ".cm-line": { padding: "0 12px" },
  ".cm-gutters": { backgroundColor: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" },
  ".cm-gutterElement": { padding: "0 8px", minWidth: "36px" },
  ".cm-cursor": { borderLeftColor: "hsl(var(--primary))" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "hsl(var(--primary) / 0.2)" },
});

export default function PseudocodeStepEditor({ code, onChange, line }: { code: string; onChange: (value: string) => void; line: number }) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView>();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialCode = useRef(code);
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({ doc: initialCode.current, extensions: [
        lineNumbers(), history(), drawSelection(), theme, executionLine,
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        EditorView.contentAttributes.of({ "aria-label": "Editor pseudocod", role: "textbox", "aria-multiline": "true", spellcheck: "false" }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
      ] }),
    });
    editor.current = view;
    return () => { view.destroy(); editor.current = undefined; };
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== code) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
    }
  }, [code]);
  useEffect(() => {
    const view = editor.current;
    if (!view) return;
    const effects = [markLine.of(line)];
    if (line > 0 && line <= view.state.doc.lines) {
      view.dispatch({ effects: [...effects, EditorView.scrollIntoView(view.state.doc.line(line).from, { y: "nearest" })] });
    } else view.dispatch({ effects });
  }, [line]);
  return <div ref={host} className="h-[360px] min-w-0 overflow-hidden sm:h-[480px]" />;
}