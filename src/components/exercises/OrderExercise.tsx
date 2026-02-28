import { useState, useCallback } from "react";
import { Exercise } from "@/data/courses";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

interface Props {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
  feedback: "correct" | "wrong" | null;
}

const OrderExercise = ({ exercise, onAnswer, feedback }: Props) => {
  const [items, setItems] = useState(() => {
    if (!exercise.lines) return [];
    return [...exercise.lines].sort(() => Math.random() - 0.5);
  });
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const newItems = [...items];
    const [dragged] = newItems.splice(draggedIdx, 1);
    newItems.splice(idx, 0, dragged);
    setItems(newItems);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => setDraggedIdx(null);

  const moveItem = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const [item] = newItems.splice(from, 1);
      newItems.splice(to, 0, item);
      return newItems;
    });
  }, []);

  const handleSubmit = () => {
    const isCorrect = items.every((item, idx) => item.order === idx + 1);
    onAnswer(isCorrect);
  };

  return (
    <div>
      <p className="text-foreground font-bold mb-6">{exercise.question}</p>
      <div className="space-y-2 mb-6">
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable={feedback === null}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 rounded-lg border p-3 font-mono text-sm transition-all cursor-grab active:cursor-grabbing ${
              draggedIdx === idx
                ? "border-primary bg-primary/10 scale-105"
                : "border-border bg-card"
            } ${feedback !== null ? "cursor-default" : ""}`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <code className="text-foreground">{item.text}</code>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                disabled={idx === 0 || feedback !== null}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 px-1"
              >
                ▲
              </button>
              <button
                onClick={() => idx < items.length - 1 && moveItem(idx, idx + 1)}
                disabled={idx === items.length - 1 || feedback !== null}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 px-1"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={feedback !== null} className="w-full">
        Verifică
      </Button>
    </div>
  );
};

export default OrderExercise;
