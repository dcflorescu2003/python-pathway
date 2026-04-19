

## Plan: Dialoguri scrollabile pe mobil + close button mereu vizibil

### Problemă
Pe mobil în browser, `PremiumDialog` (și potențial alte dialoguri) depășesc înălțimea ecranului. Butonul X de închidere e poziționat absolut în interiorul `DialogContent`, deci când conținutul e mai mare decât viewport-ul, X-ul iese din ecran și utilizatorul nu poate închide modalul.

### Cauza
În `src/components/ui/dialog.tsx` (baza shadcn folosită de toate dialogurile):
- `DialogContent` nu are `max-height` și nici `overflow-y-auto` → conținutul iese în afara viewport-ului
- `DialogClose` (X) e `absolute top-4 right-4` în interiorul Content → se mișcă cu conținutul când e prea mare

### Soluție — fix global la baza UI (rezolvă peste tot dintr-o singură mișcare)

**1. `src/components/ui/dialog.tsx`**
- Adaug pe `DialogContent`: `max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col` (folosesc `100dvh` pentru a respecta corect bara mobilă a browserelor)
- Wrap children într-un container intern scrollabil `<div className="overflow-y-auto -mx-6 px-6 -mb-6 pb-6">{children}</div>`, astfel încât butonul X să rămână ancorat la marginea ferestrei vizibile
- Mențin `w-[calc(100%-2rem)]` (deja are `w-full max-w-lg`) — pe mobil se vede cu margini mici
- Cresc zona de tap pe X: `h-8 w-8 flex items-center justify-center` în loc de doar 4×4 (touch target friendly, conform regulilor mobile-first)

**2. `src/components/ui/alert-dialog.tsx`**
- Identic: `max-h-[calc(100dvh-2rem)] overflow-y-auto` pe `AlertDialogContent` (fără X, deci nu trebuie wrapper intern — doar scroll direct)

**3. `src/components/PremiumDialog.tsx` și `src/components/TeacherPremiumDialog.tsx`**
- Schimb `max-w-sm mx-auto` → `max-w-sm` (mx-auto e redundant; primitive-ul deja centrează)
- Reduc `space-y-4 py-4` → `space-y-3 py-2` ca să încapă mai bine fără scroll pe ecrane medii (375×667+)

### Locuri verificate care beneficiază automat
- `PremiumDialog`, `TeacherPremiumDialog`, `LevelUpDialog`, `StreakCelebrationDialog`, `CouponExpiredDialog`, `LevelRoadmap` (deja are `max-h-[80vh]`, dar va fi consistent), toate `AlertDialog` din admin/teacher

### Nu modific
- Logica dialogurilor / conținutul lor (text, butoane, prețuri)
- `Drawer`, `Sheet` (componente separate, nu sunt afectate)

### Fișiere modificate (4)
1. `src/components/ui/dialog.tsx` — fix structural
2. `src/components/ui/alert-dialog.tsx` — fix scroll
3. `src/components/PremiumDialog.tsx` — micro-tuning spacing
4. `src/components/TeacherPremiumDialog.tsx` — micro-tuning spacing

