

# Acces Admin dinamic — tab "Setări" + buton rapid în app

## Ce facem

1. **Tabel nou `admin_emails`** în baza de date — stochează email-urile autorizate pentru admin (înlocuiește hardcoded `ADMIN_EMAILS`)
2. **Tab nou "Setări"** în panoul admin — permite adăugarea/ștergerea email-urilor admin autorizate
3. **Buton "Admin"** vizibil în pagina de cont (`AuthPage`) — apare doar dacă email-ul utilizatorului curent este în lista `admin_emails`

## Modificări

### 1. Migrare DB — tabel `admin_emails`
```sql
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
-- Toți autentificații pot citi (pentru a verifica dacă sunt admin)
CREATE POLICY "Anyone can read admin_emails" ON public.admin_emails FOR SELECT TO authenticated USING (true);
-- Doar adminii (din user_roles) pot modifica
CREATE POLICY "Admins can insert" ON public.admin_emails FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete" ON public.admin_emails FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
-- Seed cu email-ul existent
INSERT INTO public.admin_emails (email) VALUES ('dcflorescu2003@gmail.com');
```

### 2. Hook nou `src/hooks/useAdminAccess.ts`
- Query pe `admin_emails` pentru a verifica dacă `user.email` este în tabel
- Returnează `{ isAdmin, isLoading }`
- Folosit atât în `AdminPage` cât și în `AuthPage`

### 3. `src/pages/AdminPage.tsx`
- Înlocuiește `ADMIN_EMAILS` hardcoded cu hook-ul `useAdminAccess`
- Adaugă tab "Setări" cu icon `Settings`
- Tab-ul conține:
  - Lista email-urilor admin existente (din `admin_emails`)
  - Input + buton "Adaugă" pentru email nou
  - Buton ștergere pe fiecare email (cu protecție să nu te ștergi pe tine)

### 4. `src/pages/AuthPage.tsx` (AccountView)
- Importă `useAdminAccess`
- Dacă `isAdmin === true`, afișează un buton "⚙️ Panou Admin" care navighează la `/admin`
- Plasat între statistici și butonul de deconectare

## Detalii tehnice
- Tabelul `admin_emails` este separat de `user_roles` — `user_roles` controlează RLS-ul la nivel DB, iar `admin_emails` controlează accesul la UI-ul admin
- Email-ul curent (`dcflorescu2003@gmail.com`) este seed-uit automat prin migrare
- Hook-ul folosește React Query cu `staleTime` mare (conținut rar schimbat)

