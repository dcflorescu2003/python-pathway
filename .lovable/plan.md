

# Notificări in-app ca fallback pentru push notifications

## Ce facem
Creăm un sistem de notificări in-app: când profesorul atribuie provocări, pe lângă push-ul nativ se creează și înregistrări în DB. Elevii văd un badge pe pagina principală și o listă de notificări necitite.

## Modificări

### 1. Migrare DB — tabel `notifications`
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Elevul vede doar notificările proprii
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
-- Insert doar din service role (edge function) sau direct din client cu policy
CREATE POLICY "Authenticated insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
```

### 2. `src/components/teacher/ChallengeAssigner.tsx`
După ce creează provocările, inserăm notificări in-app pentru fiecare elev:
```typescript
// După crearea challenges, inserăm notificări in-app
const notifs = studentIds.map(sid => ({
  user_id: sid,
  title: "📚 Provocare nouă!",
  body: `Ai primit ${selected.length} provocări noi de la profesor!`,
}));
await supabase.from("notifications").insert(notifs);
```
Asta rulează indiferent dacă push-ul reușește sau nu.

### 3. `src/hooks/useNotifications.ts` (fișier nou)
- Query notificări necitite: `SELECT * FROM notifications WHERE user_id = auth.uid() AND read = false ORDER BY created_at DESC`
- Funcție `markAsRead(id)` și `markAllAsRead()`
- `unreadCount` computed

### 4. `src/components/NotificationBell.tsx` (fișier nou)
- Iconița Bell cu badge numeric (unread count)
- Click deschide un Popover cu lista notificărilor
- Buton „Marchează toate ca citite"
- Fiecare notificare: titlu, body, timp relativ (acum 5 min)

### 5. `src/pages/Index.tsx`
- Adăugăm `NotificationBell` în header-ul paginii principale (lângă logo/avatar)

### Fișiere
1. **Migrare SQL** — tabel `notifications` + RLS
2. **`src/hooks/useNotifications.ts`** — hook CRUD notificări
3. **`src/components/NotificationBell.tsx`** — UI bell + popover
4. **`src/components/teacher/ChallengeAssigner.tsx`** — insert notificări in-app
5. **`src/pages/Index.tsx`** — render NotificationBell în header

