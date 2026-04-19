
## Vizibilitate verificare profesor

În `AccountProfileTab.tsx` (linia ~287), butonul actual e `variant="secondary"` simplu — se pierde vizual. Îl transform într-un card-CTA proeminent.

### Schimbare în `src/components/account/AccountProfileTab.tsx`

Înlocuiesc blocul:
```tsx
<Button variant="secondary" className="w-full gap-2" onClick={...}>
  <Shield className="h-4 w-4" /> Începe verificarea contului de profesor
</Button>
```

Cu un **Card evidențiat** cu:
- Border accent (warning/primary gradient) + fundal subtil
- Iconiță Shield mare
- Titlu bold: „Verifică-ți contul de profesor"
- Listă scurtă de beneficii (cu ✓):
  - Acces la **biblioteca de teste predefinite** ale platformei
  - Acces la **banca de exerciții** pentru construcția testelor
  - Insignă „Profesor Verificat" + 2 coduri invitație colegi
- Buton mare full-width (gradient primary), text: „Începe verificarea"
- Sub-text mic: „Durează 2 minute. 4 metode de verificare disponibile."

### Fișier modificat (1)
- `src/components/account/AccountProfileTab.tsx` — doar blocul `teacherStatus === "unverified"` din ramura non-form
