import { useState } from "react";
import { Exercise, ExerciseType } from "@/hooks/useChapters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import MarkdownEditor from "./MarkdownEditor";

interface Props {
  exercise?: Exercise;
  onSave: (exercise: Exercise) => void;
  onCancel: () => void;
  lessonId: string;
  nextIndex: number;
}

const generateId = (lessonId: string, index: number) => `${lessonId}-e${index}`;

const emptyExercise = (lessonId: string, index: number): Exercise => ({
  id: generateId(lessonId, index),
  type: "quiz",
  question: "",
  xp: 5,
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correctOptionId: "a",
  explanation: "",
});

const ExerciseEditor = ({ exercise, onSave, onCancel, lessonId, nextIndex }: Props) => {
  const [data, setData] = useState<Exercise>(
    exercise || emptyExercise(lessonId, nextIndex)
  );

  const updateField = <K extends keyof Exercise>(key: K, value: Exercise[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (type: ExerciseType) => {
    const base: Exercise = {
      id: data.id,
      type,
      question: data.question,
      xp: data.xp,
      explanation: data.explanation,
    };

    switch (type) {
      case "quiz":
        setData({
          ...base,
          options: [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" },
          ],
          correctOptionId: "a",
        });
        break;
      case "fill":
        setData({
          ...base,
          codeTemplate: "",
          blanks: [{ id: "b1", answer: "" }],
        });
        break;
      case "order":
        setData({
          ...base,
          lines: [{ id: "l1", text: "", order: 1 }],
        });
        break;
      case "truefalse":
        setData({
          ...base,
          statement: "",
          isTrue: true,
        });
        break;
      case "match":
        setData({
          ...base,
          pairs: [
            { id: "p1", left: "", right: "" },
            { id: "p2", left: "", right: "" },
            { id: "p3", left: "", right: "" },
          ],
        });
        break;
      case "card":
        setData({
          ...base,
          codeTemplate: "",
        });
        break;
    }
  };

  const renderQuizFields = () => (
    <div className="space-y-3">
      <Label className="text-foreground">Opțiuni</Label>
      {data.options?.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground w-6">{opt.id.toUpperCase()}</span>
          <Input
            value={opt.text}
            onChange={(e) => {
              const newOpts = [...(data.options || [])];
              newOpts[i] = { ...newOpts[i], text: e.target.value };
              updateField("options", newOpts);
            }}
            placeholder={`Opțiunea ${opt.id.toUpperCase()}`}
          />
        </div>
      ))}
      <div>
        <Label className="text-foreground">Răspuns corect</Label>
        <Select value={data.correctOptionId || "a"} onValueChange={(v) => updateField("correctOptionId", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {data.options?.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.id.toUpperCase()} - {o.text || "(gol)"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderFillFields = () => (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">Șablon cod (folosește ___ pentru spații goale)</Label>
        <Textarea
          value={data.codeTemplate || ""}
          onChange={(e) => updateField("codeTemplate", e.target.value)}
          placeholder='x = ___\nprint(___)'
          className="font-mono text-sm"
          rows={4}
        />
      </div>
      <div>
        <Label className="text-foreground">Răspunsuri (câte un blank per ___)</Label>
        {data.blanks?.map((blank, i) => (
          <div key={blank.id} className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground w-8">#{i + 1}</span>
            <Input
              value={blank.answer}
              onChange={(e) => {
                const newBlanks = [...(data.blanks || [])];
                newBlanks[i] = { ...newBlanks[i], answer: e.target.value };
                updateField("blanks", newBlanks);
              }}
              placeholder="Răspuns"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newBlanks = (data.blanks || []).filter((_, j) => j !== i);
                updateField("blanks", newBlanks);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            const newBlanks = [...(data.blanks || []), { id: `b${(data.blanks?.length || 0) + 1}`, answer: "" }];
            updateField("blanks", newBlanks);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Adaugă blank
        </Button>
      </div>
    </div>
  );

  const renderOrderFields = () => (
    <div className="space-y-3">
      <Label className="text-foreground">Linii de cod (ordinea corectă)</Label>
      {data.lines?.map((line, i) => (
        <div key={line.id} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
          <Input
            value={line.text}
            onChange={(e) => {
              const newLines = [...(data.lines || [])];
              newLines[i] = { ...newLines[i], text: e.target.value };
              updateField("lines", newLines);
            }}
            placeholder={`Linia ${i + 1}`}
            className="font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newLines = (data.lines || []).filter((_, j) => j !== i)
                .map((l, j) => ({ ...l, order: j + 1 }));
              updateField("lines", newLines);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const newLines = [...(data.lines || []), {
            id: `l${(data.lines?.length || 0) + 1}`,
            text: "",
            order: (data.lines?.length || 0) + 1,
          }];
          updateField("lines", newLines);
        }}
      >
        <Plus className="h-4 w-4 mr-1" /> Adaugă linie
      </Button>
    </div>
  );

  const renderTrueFalseFields = () => (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">Afirmație</Label>
        <Textarea
          value={data.statement || ""}
          onChange={(e) => updateField("statement", e.target.value)}
          placeholder="Afirmația de evaluat..."
          rows={2}
        />
      </div>
      <div>
        <Label className="text-foreground">Răspuns corect</Label>
        <Select
          value={data.isTrue ? "true" : "false"}
          onValueChange={(v) => updateField("isTrue", v === "true")}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Adevărat</SelectItem>
            <SelectItem value="false">Fals</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderMatchFields = () => (
    <div className="space-y-3">
      <Label className="text-foreground">Perechi (3-5)</Label>
      {data.pairs?.map((pair, i) => (
        <div key={pair.id} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
          <Input
            value={pair.left}
            onChange={(e) => {
              const newPairs = [...(data.pairs || [])];
              newPairs[i] = { ...newPairs[i], left: e.target.value };
              updateField("pairs", newPairs);
            }}
            placeholder="Stânga"
          />
          <span className="text-muted-foreground">↔</span>
          <Input
            value={pair.right}
            onChange={(e) => {
              const newPairs = [...(data.pairs || [])];
              newPairs[i] = { ...newPairs[i], right: e.target.value };
              updateField("pairs", newPairs);
            }}
            placeholder="Dreapta"
          />
          {(data.pairs?.length || 0) > 3 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newPairs = (data.pairs || []).filter((_, j) => j !== i);
                updateField("pairs", newPairs);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      {(data.pairs?.length || 0) < 5 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newPairs = [...(data.pairs || []), { id: `p${(data.pairs?.length || 0) + 1}`, left: "", right: "" }];
            updateField("pairs", newPairs);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Adaugă pereche
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground">
        {exercise ? "Editează exercițiu" : "Exercițiu nou"}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-foreground">Tip exercițiu</Label>
          <Select value={data.type} onValueChange={(v) => handleTypeChange(v as ExerciseType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quiz">Quiz (variante)</SelectItem>
              <SelectItem value="fill">Completare cod</SelectItem>
              <SelectItem value="order">Ordonare linii</SelectItem>
              <SelectItem value="truefalse">Adevărat / Fals</SelectItem>
              <SelectItem value="match">Asociere</SelectItem>
              <SelectItem value="card">📖 Cartonaș teoretic</SelectItem>
              <SelectItem value="problem">💻 Problemă (cod + teste)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-foreground">XP</Label>
          <Input
            type="number"
            value={data.xp}
            onChange={(e) => updateField("xp", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label className="text-foreground">{data.type === "card" ? "Titlu cartonaș" : "Întrebare"}</Label>
        <Textarea
          value={data.question}
          onChange={(e) => updateField("question", e.target.value)}
          placeholder={data.type === "card" ? "Titlul cartonașului..." : "Scrie întrebarea aici..."}
          rows={2}
        />
      </div>

      {data.type !== "card" && data.type === "quiz" && renderQuizFields()}
      {data.type !== "card" && data.type === "fill" && renderFillFields()}
      {data.type !== "card" && data.type === "order" && renderOrderFields()}
      {data.type !== "card" && data.type === "truefalse" && renderTrueFalseFields()}
      {data.type !== "card" && data.type === "match" && renderMatchFields()}

      {data.type === "card" && (
        <div>
          <Label className="text-foreground">Cod Python (opțional)</Label>
          <Textarea
            value={data.codeTemplate || ""}
            onChange={(e) => updateField("codeTemplate", e.target.value)}
            placeholder="print('Hello!')"
            className="font-mono text-sm"
            rows={4}
          />
        </div>
      )}

      <div>
        <Label className="text-foreground">{data.type === "card" ? "Explicație / Conținut" : "Explicație (apare după răspuns)"}</Label>
        {data.type === "card" ? (
          <MarkdownEditor
            value={data.explanation || ""}
            onChange={(v) => updateField("explanation", v)}
            placeholder="Textul explicativ al cartonașului..."
            rows={6}
          />
        ) : (
          <Textarea
            value={data.explanation || ""}
            onChange={(e) => updateField("explanation", e.target.value)}
            placeholder="Explică de ce răspunsul corect este..."
            rows={2}
          />
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={() => onSave(data)} className="flex-1">
          💾 Salvează
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Anulează
        </Button>
      </div>
    </div>
  );
};

export default ExerciseEditor;
