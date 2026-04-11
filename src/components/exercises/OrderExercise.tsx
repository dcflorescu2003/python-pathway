import { useState, useCallback, useRef } from "react";
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
  const touchStartY = useRef<number>(0);
  const touchCurrentIdx = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Desktop drag
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

  // Touch drag
  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    if (feedback !== null) return;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentIdx.current = idx;
    setDraggedIdx(idx);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchCurrentIdx.current === null || !containerRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const container = containerRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    
    // Find which item we're over
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        if (i !== touchCurrentIdx.current) {
          const fromIdx = touchCurrentIdx.current!;
          setItems((prev) => {
            const newItems = [...prev];
            const [item] = newItems.splice(fromIdx, 1);
            newItems.splice(i, 0, item);
            return newItems;
          });
          touchCurrentIdx.current = i;
          setDraggedIdx(i);
        }
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    touchCurrentIdx.current = null;
    setDraggedIdx(null);
  };

  const moveItem = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const [item] = newItems.splice(from, 1);
      newItems.splice(to, 0, item);
      return newItems;
    });
  }, []);

  const handleSubmit = () => {
    // Check if ordering is correct, allowing lines with the same group to be interchangeable
    const isCorrect = (() => {
      // Build expected order sequence, respecting groups
      const expectedOrders = items.map(item => item.order);
      
      // If no groups defined, use strict check
      const hasGroups = items.some(item => item.group !== undefined);
      if (!hasGroups) {
        return items.every((item, idx) => item.order === idx + 1);
      }
      
      // With groups: items in the same group are interchangeable
      // Check that the sequence of group-effective-orders is non-decreasing
      // Assign each item its group's minimum order (or its own order if no group)
      const groupMinOrder = new Map<number, number>();
      for (const item of exercise.lines || []) {
        if (item.group !== undefined) {
          const current = groupMinOrder.get(item.group);
          if (current === undefined || item.order < current) {
            groupMinOrder.set(item.group, item.order);
          }
        }
      }
      
      const effectiveOrder = (item: { order: number; group?: number }) => 
        item.group !== undefined ? (groupMinOrder.get(item.group) ?? item.order) : item.order;
      
      for (let i = 1; i < items.length; i++) {
        if (effectiveOrder(items[i]) < effectiveOrder(items[i - 1])) {
          return false;
        }
      }
      return true;
    })();
    onAnswer(isCorrect);
  };

  const correctOrder = feedback === "wrong" && exercise.lines
    ? [...exercise.lines].sort((a, b) => a.order - b.order)
    : null;

  return (
    <div>
      <p className="text-foreground font-bold mb-6 text-base">{exercise.question}</p>
      <div className="space-y-2 mb-6 mx-4" ref={containerRef}>
        {items.map((item, idx) => {
          const hasGroups = items.some(it => it.group !== undefined);
          const isCorrectPos = hasGroups
            ? (() => {
                // For grouped items, check relative ordering is valid
                if (idx === 0) return true;
                const prev = items[idx - 1];
                const getEffective = (it: typeof item) => {
                  if (it.group === undefined) return it.order;
                  const groupOrders = (exercise.lines || []).filter(l => l.group === it.group).map(l => l.order);
                  return Math.min(...groupOrders);
                };
                return getEffective(item) >= getEffective(prev);
              })()
            : item.order === idx + 1;
          return (
            <div
              key={item.id}
              draggable={feedback === null}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, idx)}
              onTouchMove={(e) => handleTouchMove(e)}
              onTouchEnd={handleTouchEnd}
              className={`flex items-center gap-3 rounded-lg border p-3 font-mono text-sm transition-all select-none ${
                feedback
                  ? isCorrectPos
                    ? "border-primary/50 bg-primary/5"
                    : "border-destructive/50 bg-destructive/5"
                  : draggedIdx === idx
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border bg-card"
              } ${feedback !== null ? "cursor-default" : "cursor-grab active:cursor-grabbing touch-none"}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
              <code className="text-foreground whitespace-pre-wrap break-words flex-1">{item.text}</code>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                  disabled={idx === 0 || feedback !== null}
                  className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-2 py-1"
                >
                  ▲
                </button>
                <button
                  onClick={() => idx < items.length - 1 && moveItem(idx, idx + 1)}
                  disabled={idx === items.length - 1 || feedback !== null}
                  className="text-base text-muted-foreground hover:text-foreground disabled:opacity-30 px-2 py-1"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {feedback === "wrong" && correctOrder && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm text-primary font-bold mb-2">Ordinea corectă:</p>
          {correctOrder.map((line, i) => (
            <p key={line.id} className="text-sm font-mono text-muted-foreground whitespace-pre-wrap break-words">
              {i + 1}. {line.text}
            </p>
          ))}
        </div>
      )}

      {!feedback && (
        <Button onClick={handleSubmit} disabled={feedback !== null} className="w-full h-14 text-lg font-bold">
          Verifică
        </Button>
      )}
    </div>
  );
};

export default OrderExercise;
