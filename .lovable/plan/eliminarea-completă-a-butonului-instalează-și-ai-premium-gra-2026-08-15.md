# Eliminarea completă a butonului „Instalează și ai Premium gratuit”

## Situația actuală (verificat)
- Căutarea în tot codul sursă nu găsește nicăieri textul „Instalează” / „Premium gratuit”: butonul nu mai există în codul curent.
- Inspecția paginii live din preview confirmă: elementul nu se randează.
- A rămas totuși un rest nefolosit: hook-ul `src/hooks/useInstallPrompt.ts`, care nu este importat de nicio componentă.
- Concluzie: butonul din captura ta vine din versiunea publicată (build vechi), nu din codul actual.

## Ce fac
1. Șterg hook-ul nefolosit `src/hooks/useInstallPrompt.ts`, ca să nu poată fi refolosit accidental pentru un banner de instalare.
2. Mai fac o verificare finală în cod pentru orice referință la instalare PWA / promisiune de Premium gratuit la instalare și o elimin dacă apare.
3. Republic aplicația, ca versiunea live să nu mai afișeze bannerul.

## Note
Nu se modifică nimic din logica de Premium — regula rămâne: fără Premium gratuit pentru instalare, doar prin Stripe / IAP / Play Billing / cupoane.
