

## Diagnoză

Screenshot-ul arată **TeacherWizard.tsx** step 0 ("Pasul 1: Alege liceul"), nu `TeacherVerificationForm`. Fix-ul de pre-populare aplicat anterior s-a făcut doar în `TeacherVerificationForm`. În `TeacherWizard`:

- `selectedSchoolId` (linia 21) pornește `null` — niciodată citit din profil.
- Userul are deja `school_id` în profil (din onboarding), vizibil ca banner "COLEGIUL ALEXANDRU CEL BUN" pe pagina de cont.
- Rezultat: trebuie să caute și să selecteze din nou liceul, deși îl avem deja salvat.

## Plan reparare

### `src/components/account/TeacherWizard.tsx`

Adaug `useEffect` pe mount care:
1. Citește `school_id` din `profiles` pentru `user.id`.
2. Dacă există și se găsește în `schools[]` → setează `selectedSchoolId`.
3. Userul poate oricând schimba selecția (click pe alt liceu sau search).

Bonus mic: dacă liceul e pre-selectat, scroll automat la el în listă (opțional, pot sări dacă complică). Voi păstra simplu doar pre-selectarea.

### Fișiere modificate (1)
- `src/components/account/TeacherWizard.tsx` — adaug `useEffect` import + hook pentru pre-populare

### Nu modific
- `TeacherVerificationForm.tsx` (deja are pre-popularea corectă)
- Logica de validare / submit / steps

