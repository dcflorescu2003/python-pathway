import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import {
  type ItemType,
  useCompetencyCatalog,
  useItemCompetencies,
  useRemoveItemCompetency,
  useSetItemCompetency,
} from "@/hooks/useCompetencies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface CompetencyTaggerProps {
  itemType: ItemType;
  itemId: string | null | undefined;
  /** Show a small note when itemId is missing (e.g. "Salvează întâi exercițiul"). */
  emptyHint?: string;
  /** Reduced label when used inside a dense form. */
  compact?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  A: "A. Fundamente algoritmice",
  B: "B. Python de bază",
  C: "C. Decizie și repetiție",
  D: "D. Prelucrări numerice",
  E: "E. Liste, stive, cozi",
  F: "F. Generare și sortare",
  G: "G. Subprograme",
  H: "H. Fișiere și interfețe",
};

const WEIGHT_OPTIONS = [
  { value: "0.25", label: "Pondere 0.25 (atinsă tangențial)" },
  { value: "0.5", label: "Pondere 0.5 (parțial)" },
  { value: "1", label: "Pondere 1.0 (principală)" },
];

export function CompetencyTagger({
  itemType,
  itemId,
  emptyHint = "Salvează întâi pentru a adăuga microcompetențe.",
  compact,
}: CompetencyTaggerProps) {
  const { data: catalog, isLoading: catalogLoading } = useCompetencyCatalog();
  const { data: mappings, isLoading: mappingsLoading } = useItemCompetencies(
    itemType,
    itemId,
  );
  const setMutation = useSetItemCompetency(itemType, itemId ?? "");
  const removeMutation = useRemoveItemCompetency(itemType, itemId ?? "");
  const [open, setOpen] = useState(false);

  const microById = useMemo(() => {
    const map = new Map<string, (typeof catalog.micro)[number]>();
    catalog?.micro.forEach((m) => map.set(m.id, m));
    return map;
  }, [catalog]);

  const grouped = useMemo(() => {
    if (!catalog) return [];
    const byCategory = new Map<string, typeof catalog.micro>();
    catalog.micro.forEach((m) => {
      if (!byCategory.has(m.category)) byCategory.set(m.category, []);
      byCategory.get(m.category)!.push(m);
    });
    return Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [catalog]);

  const selectedIds = useMemo(
    () => new Set((mappings ?? []).map((m) => m.microcompetency_id)),
    [mappings],
  );

  if (!itemId) {
    return (
      <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        {emptyHint}
      </div>
    );
  }

  const handleToggle = async (microId: string) => {
    if (selectedIds.has(microId)) {
      try {
        await removeMutation.mutateAsync(microId);
      } catch (err) {
        toast({
          title: "Eroare",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    } else {
      try {
        await setMutation.mutateAsync({ microcompetency_id: microId, weight: 1 });
      } catch (err) {
        toast({
          title: "Eroare",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    }
  };

  const handleWeightChange = async (microId: string, weight: number) => {
    try {
      await setMutation.mutateAsync({ microcompetency_id: microId, weight });
    } catch (err) {
      toast({
        title: "Eroare",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Microcompetențe vizate</span>
          {(mappings?.length ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground">
              {mappings?.length} selectate
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(mappings ?? []).map((mp) => {
          const micro = microById.get(mp.microcompetency_id);
          if (!micro) return null;
          return (
            <div
              key={mp.id}
              className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs"
            >
              <Badge variant="secondary" className="font-mono text-[10px]">
                {micro.code}
              </Badge>
              <span className="max-w-[18rem] truncate" title={micro.title}>
                {micro.title}
              </span>
              <Select
                value={String(mp.weight)}
                onValueChange={(v) => handleWeightChange(micro.id, Number(v))}
              >
                <SelectTrigger className="h-6 w-16 px-1 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                onClick={() => handleToggle(micro.id)}
                aria-label="Elimină"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-between"
            disabled={catalogLoading || mappingsLoading}
          >
            <span className="text-xs text-muted-foreground">
              {catalogLoading ? "Se încarcă catalogul…" : "Adaugă microcompetență…"}
            </span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[28rem] p-0" align="start">
          <Command>
            <CommandInput placeholder="Caută după cod sau text (ex. M61, listă)…" />
            <CommandList className="max-h-80">
              <CommandEmpty>Nicio microcompetență găsită.</CommandEmpty>
              {grouped.map(([category, items]) => (
                <CommandGroup
                  key={category}
                  heading={CATEGORY_LABELS[category] ?? category}
                >
                  {items.map((m) => {
                    const isSelected = selectedIds.has(m.id);
                    return (
                      <CommandItem
                        key={m.id}
                        value={`${m.code} ${m.title}`}
                        onSelect={() => handleToggle(m.id)}
                        className="flex items-start gap-2"
                      >
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-mono text-xs text-muted-foreground">
                            {m.code}
                          </div>
                          <div className="text-xs">{m.title}</div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
