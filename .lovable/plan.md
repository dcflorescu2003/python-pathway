## Nivele noi la Profilul de competențe

Înlocuim etichetele actuale („Stăpânit / În progres / Început / Necesită exersare") cu 4 nivele bazate pe procentul de masterat, aplicate atât la Competențele Generale (CG), cât și la cele Specifice (CS). „Neevaluat" rămâne pentru CS/CG fără date.

### Praguri
- **Insuficient** — mastery < 40%
- **Nivel de bază** — 40% ≤ mastery < 60%
- **Nivel consolidat** — 60% ≤ mastery < 85%
- **Nivel avansat** — mastery ≥ 85%
- **Neevaluat** — fără date (unchanged)

### Modificări
1. **`src/components/account/CompetencyProfileCard.tsx`**
   - Rescriu `masteryLabel(m)` cu noile praguri și denumiri.
   - Ajustez `tone` → variant/culoare Badge:
     - Insuficient → `destructive`
     - Bază → `warning` (secondary)
     - Consolidat → `secondary`
     - Avansat → `default` (primary)
     - Neevaluat → `secondary` muted
   - Aplic același badge și la CG (deja folosește `masteryLabel`) și îl afișez și la rândurile de CS care în prezent arată doar procentul — adaug un mic badge de nivel lângă procent pentru CS evaluabile.

2. **Descrierile detaliate** rămân în afara UI-ului acum — le rezervăm pentru raportul viitor pentru profesori (nu construim raportul în acest task).

### Nu se modifică
- Logica de calcul mastery (`get_student_competency_profile` RPC, ponderi 60/40).
- Excluderea CS fără microcompetențe.
- Structura DB.
