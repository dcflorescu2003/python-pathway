## Întrebarea despre iOS — răspuns scurt

**NU trebuie să adaugi nimic nou pentru anulare.** Apple **nu permite** ca anularea abonamentului să se facă din interiorul aplicației — este interzis prin App Store Review Guidelines (secțiunea 3.1.2). Userul **trebuie** redirecționat către Settings → Apple ID → Subscriptions.

Și avem deja asta implementat:

- `src/lib/iosBilling.ts` → `openIOSSubscriptionManagement()` apelează `plugin.openManageSubscriptions()` (deschide pagina nativă de subscripții) cu fallback pe `itms-apps://apps.apple.com/account/subscriptions`.
- În `PremiumDialog.tsx` butonul afișează **„Gestionează în App Store"** când userul e deja premium pe iOS.

✅ Deci pe iOS suntem ok și conform cu regulile Apple. Niciun cod nou de scris.

---

## Notificări & cartonașe lipsă — ce adăugăm

### A. Cron jobs noi pe server

```text
1. send-evening-reminder         → zilnic 19:00 ora României (16:00 UTC vara / 17:00 UTC iarna → folosim 17:00 UTC)
2. send-weekly-comeback          → luni 10:00 UTC, pentru utilizatori inactivi >7 zile
3. send-lives-refilled           → la fiecare 30 minute (verifică cine a ajuns la 5/5 vieți)
4. send-teacher-reminder         → marți & joi 09:00 UTC, pentru profesori cu submisii neevaluate
5. send-new-lesson-notification  → declanșat manual din admin când publici lecție nouă (NU cron)
```

### B. Edge Functions noi de creat


| Funcție                 | Logică                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send-evening-reminder` | Useri activi azi cu lecții <3 → mesaje "Mai ai timp pentru o lecție rapidă", "Ziua nu e completă fără Python". Skip dacă deja rezolvați 3+ lecții azi.            |
| `send-weekly-comeback`  | Useri inactivi >7 zile, cu cel puțin 1 lecție făcută vreodată. Mesaj diferit de cel zilnic, mai emoțional ("Te-am pierdut?"). Max 1 dată/săptămână per user.      |
| `send-lives-refilled`   | Query: useri care au ajuns la 5/5 vieți în ultimele 30 min (ne folosim de `last_life_refill_at`). Notificare push: "Vieți pline! 5/5 ❤️ — gata de o nouă lecție". |
| `send-teacher-reminder` | Profesori verificați cu `test_submissions` ne-evaluate >24h sau clase noi cu studenți noi.                                                                        |
| `notify-new-lesson`     | Apelată din admin → trimite push tuturor (sau target). Body: "Lecție nouă: {titlu}".                                                                              |


Toate vor folosi același pattern din `send-streak-reminder`: in-app notification în tabela `notifications` + push prin FCM + APNs.

### C. Cartonașe noi (frontend)


| Cartonaș                       | Trigger                                                                          | Frecvență                  |
| ------------------------------ | -------------------------------------------------------------------------------- | -------------------------- |
| **LivesRefilledDialog**        | La deschiderea appului dacă vieți=5/5 ȘI ultima dată afișat era >24h             | Max 1/zi                   |
| **NewLessonDialog**            | Push primit cu type=`new_lesson` ȘI userul deschide notificarea                  | La deschiderea notificării |
| **TeacherPendingReviewBanner** | Banner (nu dialog) în /account tab profesor dacă există submisii neevaluate >24h | Permanent până rezolvă     |
| **ComebackDialog**             | User logat după >7 zile inactivitate                                             | 1 dată per "comeback"      |


### D. Modificări DB (migrații)

```text
- ADD COLUMN profiles.last_life_refill_at timestamptz
- ADD COLUMN profiles.last_comeback_shown_at date
- ADD COLUMN profiles.last_evening_reminder_at date
- ADD COLUMN profiles.last_weekly_reminder_at date
- ADD COLUMN profiles.last_teacher_reminder_at date
- Trigger pe user_lives: când ajunge la 5, setează last_life_refill_at
```

### E. Configurare cron (în baza de date)

```text
send-evening-reminder       → '0 17 * * *'         (19:00 RO iarna)
send-weekly-comeback        → '0 10 * * 1'         (luni 10 UTC)
send-lives-refilled         → '*/30 * * * *'       (la 30 min)
send-teacher-reminder       → '0 9 * * 2,4'        (marți & joi)
```

### F. Admin — UI nou

În `/admin` adăugăm un buton **"📢 Anunță lecție nouă"** care invocă `notify-new-lesson` cu titlul + capitolul lecției nou publicate.

---

## Ordinea execuției

1. Migrație DB: coloanele noi + trigger pe lives.
2. 5 edge functions noi (cu CORS, validare JWT, push FCM/APNs).
3. 5 cron jobs schedulate via SQL (folosind anon key + URL exact ca la `send-streak-reminder`).
4. 4 cartonașe noi în React + integrare în `Index.tsx` și `account/TeacherClassesTab.tsx`.
5. Buton admin pentru `notify-new-lesson`.
6. Hooks pentru detectarea comeback-ului și a vieților pline (folosesc `localStorage` namespaced cu user.id, conform regulii din memorie).

---

## Ce NU includem (și de ce)

- ❌ Anulare abonament din app pe iOS — interzis de Apple, deja avem deep link spre Settings.
- ❌ Reminder pentru "vieți pierdute, vino înapoi peste X minute" — devine spam, deja userul vede timer-ul în `RefillLivesDialog`. Putem adăuga ulterior dacă vrei explicit.

Confirmi planul și plec la treabă?  
  
Unde este deep link spre setting? Nu am vazut