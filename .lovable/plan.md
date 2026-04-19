
## Modificări Cont Profesor Verificat

### 1) Text status
În `src/components/account/AccountProfileTab.tsx` (linia 234):
- Înlocuiesc `"✓ Verificat"` cu `"✓ Profesor Verificat"`.

### 2) Mutare coduri invitație colegi → tabul Profil
Secțiunea „Coduri invitație pentru colegi" există acum în `TeacherClassesTab.tsx` (tabul Clase, liniile 53-82). O mut în `AccountProfileTab.tsx`, plasată **imediat sub** textul „✓ Profesor Verificat" (vizibilă doar pentru `teacherStatus === "verified"`).

**Implementare:**
- În `AccountProfileTab.tsx`:
  - Import `useTeacherReferralCodes` din `@/hooks/useTeacher`.
  - Import iconițe `Users`, `Copy`, `CheckCircle` din `lucide-react`.
  - Adaug card cu lista codurilor (cu buton Copy) sub `<p>✓ Profesor Verificat</p>`, afișat doar dacă `referralCodes.length > 0`.
- În `TeacherClassesTab.tsx`:
  - Elimin blocul de la liniile 53-82 (cardul cu coduri).
  - Elimin importul `useTeacherReferralCodes` (rămâne doar `useTeacherClasses`) și iconițele nefolosite (`Users`, `Copy`, `CheckCircle` dacă nu mai sunt folosite în altă parte).

### Fișiere modificate (2)
- `src/components/account/AccountProfileTab.tsx`
- `src/components/account/TeacherClassesTab.tsx`
