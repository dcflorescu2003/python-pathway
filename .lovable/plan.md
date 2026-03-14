

# Premium automat la instalare + text actualizat pe buton

## Ce facem
1. **Text buton**: Schimbăm textul de pe butonul de instalare din "📲 Instalează PyRo" în "📲 Instalează și ai Premium gratuit!"
2. **Premium automat la instalare**: Când app-ul detectează că rulează în mod standalone (instalat), setăm automat contul ca Premium cu `premium_until = 2026-08-31` în baza de date
3. **Detectare instalare**: Folosim `isInstalled` din `useInstallPrompt` — când e `true` și userul e logat, inserăm o redemption specială și setăm `is_premium = true`

## Modificări

### `src/pages/Index.tsx`
- Schimbăm textul butonului: `"📲 Instalează și ai Premium gratuit!"`
- Adăugăm un `useEffect` care, când `isInstalled === true` și `user` există, verifică dacă userul are deja o redemption de tip "install" — dacă nu, creează una cu `premium_until = 2026-08-31T23:59:59Z` și setează `is_premium = true` pe profil

### `src/hooks/useInstallPrompt.ts`
- După ce `promptInstall()` reușește (outcome "accepted"), setăm `isInstalled = true` — deja face asta

### Logica de activare Premium
- La detectarea instalării, facem un upsert în `coupon_redemptions` cu un `coupon_id` special (sau direct pe profiles)
- Cel mai simplu: setăm direct `is_premium = true` pe profil și salvăm în localStorage un flag `pyro-install-premium-granted` ca să nu repetăm operația
- Edge function `check-subscription` va continua să valideze premium-ul — trebuie să adăugăm și o verificare pentru "install premium" care expiră pe 31.08.2026

### `supabase/functions/check-subscription/index.ts`
- Adăugăm verificare: dacă userul a primit premium prin instalare (verificăm un câmp sau o redemption specială), și data curentă < 2026-08-31, contul rămâne premium
- Cea mai simplă abordare: folosim tabela `coupon_redemptions` cu un coupon_id NULL și `premium_until = 2026-08-31` marcat cu o convenție specială

### Migrare DB
- Facem coloana `coupon_id` din `coupon_redemptions` nullable (pentru redemptions de tip "install" care nu au cupon asociat)
- Sau alternativ, cream un cupon sistem "INSTALL-PREMIUM" în DB și îl folosim

**Abordare aleasă**: Cream un cupon de sistem `INSTALL-PREMIUM` automat prin migrare, și la detectarea instalării facem redeem pe acest cupon. Astfel logica existentă din `check-subscription` funcționează fără modificări.

### Flux:
1. User vede butonul "📲 Instalează și ai Premium gratuit!"
2. Click → prompt nativ (Android) sau dialog instrucțiuni (iOS)
3. App detectează `display-mode: standalone` → inserează redemption cu cuponul INSTALL-PREMIUM, `premium_until = 2026-08-31`
4. `check-subscription` validează automat premium-ul prin redemption existentă

