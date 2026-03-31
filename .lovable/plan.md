

# Fix: Permiterea tipului 'card' în baza de date

## Problema
Codul frontend are deja suport complet pentru cartonașe (tip `'card'` în dropdown, formular simplificat, componentă de afișare). Dar tabelul `exercises` din DB are un CHECK constraint pe coloana `type` care acceptă doar `'quiz', 'fill', 'order', 'truefalse', 'match'`. Când încerci să salvezi un cartonaș din Admin, inserarea eșuează silențios.

## Soluția
O singură migrare SQL:

```sql
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_type_check;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_type_check 
  CHECK (type IN ('quiz', 'fill', 'order', 'truefalse', 'match', 'card'));
```

## Fișiere modificate
1. **Migrare SQL** — actualizare constraint pe `exercises.type`

Nicio modificare de cod frontend — totul e deja implementat.

