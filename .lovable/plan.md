
## Analiză: Edge functions + componente nefolosite sau duplicate

### Edge Functions

| Funcție | Folosită? | Observații |
|---------|-----------|-----------|
| `check-subscription` | Da | Apelată din `useSubscription` |
| `create-checkout` | Da | Apelată din `useSubscription` |
| `customer-portal` | Da | Apelată din `useSubscription` |
| `delete-account` | Da | Apelată din `DeleteAccountPage` |
| `grade-submission` | Da | Apelată din `useTests` |
| `redeem-coupon` | Da | Apelată din `CouponRedemption` |
| `send-push` | Da | Apelată din `ChallengeAssigner` |
| `send-streak-reminder` | Da* | Nu este apelată din client, dar este o funcție de tip cron/scheduler — rămâne |

Toate edge functions sunt utilizate. Nu avem nimic de șters aici.

### Componente nefolosite

| Fișier | Motiv |
|--------|-------|
| `src/components/InstallDialog.tsx` | Nu este importată nicăieri. `Index.tsx` folosește `useInstallPrompt` direct, dar componenta `InstallDialog` nu este referită în niciun fișier. |

### Cod duplicat sau redundant

Nu am identificat duplicări semnificative în componente. `renderExercisePreview` și `renderProblemPreview` sunt definite o singură dată în `TestBuilder.tsx` și refolosite intern.

### Rezumat acțiuni propuse

1. **Ștergem `src/components/InstallDialog.tsx`** — componentă neimportată, funcționalitatea de install prompt este gestionată direct în `Index.tsx`

Impact: Minor (~90 linii), dar menține coerența codului.
