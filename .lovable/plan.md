

## UI alegere rol pentru conturi noi

În `AccountProfileTab.tsx` (linile 410-447), ramura când `!teacherStatus && !isClassMember` arată momentan: un buton outline „Devino Profesor" + un card simplu „Alătură-te unei clase". Lipsește contextul — utilizatorul nu înțelege că trebuie să aleagă între două roluri.

### Schimbarea propusă

Înlocuiesc cele 2 elemente cu o **secțiune „Alege-ți rolul"** — 2 carduri simetrice, side-by-side pe desktop / stacked pe mobil, fiecare cu iconiță, titlu, întrebare, beneficii scurte și CTA.

```text
┌─────────────────────────────────────────┐
│  Cum vrei să folosești PyRo?            │
│  Alege una dintre cele 2 variante       │
└─────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ 🎓 Profesor      │  │ 👥 Elev          │
│                  │  │                  │
│ Ești profesor    │  │ Ești elev?       │
│ de informatică?  │  │ Profesorul tău   │
│                  │  │ ți-a dat un cod? │
│ ✓ Creează clase  │  │ ✓ Acces la teste │
│ ✓ Teste & banca  │  │ ✓ Provocări      │
│ ✓ Analytics      │  │ ✓ Clasament      │
│                  │  │                  │
│ [Devino Profesor]│  │ [Cod: ____ Intră]│
└─────────────────┘  └─────────────────┘
```

**Card 1 — Profesor**
- Border `border-primary/30`, subtle gradient `from-primary/5`
- Iconiță `GraduationCap` în cerc colorat
- Titlu: „Ești profesor?"
- Sub-titlu: „Creează clase și evaluează-ți elevii"
- 3 bullet-uri scurte cu ✓
- Buton primar: „Devino Profesor" → `setShowTeacherWizard(true)`

**Card 2 — Elev**
- Border `border-accent/30`, subtle gradient `from-accent/5` (ton diferit ca să se distingă)
- Iconiță `Users` (sau `UserPlus`) în cerc colorat
- Titlu: „Ești elev?"
- Sub-titlu: „Alătură-te clasei profesorului tău"
- 3 bullet-uri scurte cu ✓
- Input cod clasă + buton „Intră" (existing logic)

**Layout**: `grid grid-cols-1 md:grid-cols-2 gap-3`. Pe mobile (target principal) cardurile rămân stacked, dar fiecare arată clar ca o "opțiune" datorită bordurilor colorate diferite și titlurilor sub formă de întrebare.

**Wizard activ**: când `showTeacherWizard === true`, ascund tot grid-ul și arăt doar wizard-ul (ca acum).

### Fișier modificat (1)
- `src/components/account/AccountProfileTab.tsx` — înlocuiesc blocul liniile 411-446

