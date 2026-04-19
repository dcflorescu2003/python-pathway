## Card Profesor AI pentru profesori verificați + „Inimi nelimitate" în ofertă

### Context tehnic

1. **Daily popup în `Index.tsx**` (liniile 142-154, 477) afișează `PremiumDialog` (Elev Premium) o dată pe zi pentru toți non-premium. Profesorii verificați primesc același cartonaș „Elev Premium", deși ar trebui să vadă „Profesor AI".
2. **Status profesor** nu e încă în `Index.tsx` — trebuie citit din `profiles.teacher_status`.
3. `**useSubscription**` expune deja `isTeacherPremium` (Stripe product match TEACHER_PRODUCT_IDS sau cupon `coupon_type='teacher'`).
4. **Inimi nelimitate**: backend-ul setează `is_premium=true` și pentru abonați Stripe Teacher (vezi `check-subscription/index.ts` linia ~138 `isPremium = stripeActive || couponActive`). Deci inimile infinite **funcționează deja automat** pentru Profesor AI — doar trebuie adăugat în textul de marketing.

### Modificări

**1) `src/pages/Index.tsx**`

- Adaug fetch ușor pentru `teacher_status` la mount (sau citesc din profile, alături de fetch-ul existent). Simplu: useEffect separat care interoghează `profiles.teacher_status` o singură dată când `user` e disponibil.
- Stare nouă: `const [teacherStatus, setTeacherStatus] = useState<string | null>(null);`
- Logica popup zilnic (liniile 142-154):
  - Condiție de afișare existentă: non-premium → rămâne.
  - Decid ce dialog să arăt: dacă `teacherStatus === 'verified'` ⇒ `showTeacherPremiumPopup=true`, altfel `showPremiumPopup=true`.
- Buton coroniță (liniile 249-253): la click, dacă profesor verificat → deschide `TeacherPremiumDialog`, altfel `PremiumDialog` (logica existentă).
- La final (linia 477): import + adaug `<TeacherPremiumDialog open={showTeacherPremium || showTeacherPremiumPopup} onOpenChange={...} />` în paralel cu cel existent.
- Cheia localStorage rămâne `pyro-premium-popup-date` (un singur popup/zi indiferent de variantă).

**2) `src/components/TeacherPremiumDialog.tsx**`

- În secțiunea „AI tier benefits" (liniile 95-119), adaug încă un beneficiu la final:
  - Iconiță `Heart` (lucide) + text bold „Inimi nelimitate" — „Exersează fără limite"
- În secțiunea `isTeacherPremium` activ (liniile 63-79), adaug sub textul existent o linie cu: `❤️ Inimi nelimitate active` pentru consistență.

### Fișiere modificate (2)

- `src/pages/Index.tsx`
- `src/components/TeacherPremiumDialog.tsx`

### Notă importantă

Inimile nelimitate sunt deja active backend pentru orice utilizator cu `is_premium=true` (inclusiv Teacher AI prin Stripe sau cupon `PROF-`). Nu sunt necesare modificări DB sau în `useProgress`. Adăugarea e doar în UI/copy.  
