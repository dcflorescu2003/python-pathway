## Modificare

În `src/components/WatchAdForLivesButton.tsx`, adaug sub buton un text mic care explică alternativa:

> „Sau ia o pauză de 20 de minute și o inimă se reumple automat."

### Detalii
- Înfășor butonul existent într-un `<div className="space-y-2">` și adaug un `<p className="text-xs text-muted-foreground text-center">` cu mesajul.
- Folosesc o iconiță `Clock` (lucide-react) lângă text pentru consistență vizuală.
- Nicio modificare la edge function sau la logica de regenerare (deja funcționează: 1 inimă / 20 min, conform `lives-system`).

### Fișiere modificate
- `src/components/WatchAdForLivesButton.tsx`