# Notificări cu navigare la click

Momentan notificările (clopoțelul) doar se marchează ca citite la click. Vreau ca fiecare notificare să ducă la pagina relevantă.

## Abordare

Adaug o coloană `link` (text, nullable) în tabela `notifications` care stochează ruta internă (ex. `/test/<assignmentId>`, `/problems`, `/account?tab=verification`). La click în `NotificationBell`, dacă există `link`, marchez ca citit + navighez cu React Router.

## Schimbări DB

- Migrație: `ALTER TABLE public.notifications ADD COLUMN link text;`
- Fără modificări de RLS (rămân aceleași).

## Mapare tip notificare → rută


| Sursă                                                                                                                                      | Eveniment                        | Link                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------- |
| `src/hooks/useTests.ts` (assignTest)                                                                                                       | Test nou primit (elev)           | `/test/<assignment_id>`                       |
| `src/hooks/useTests.ts` (releaseScores)                                                                                                    | Scoruri publicate (elev)         | `/account?tab=tests`                          |
| `src/components/teacher/ChallengeAssigner.tsx`                                                                                             | Provocare nouă (elev)            | `/problems`                                   |
| `src/components/teacher/VerificationChat.tsx`                                                                                              | Mesaj nou de la admin (profesor) | `/account?tab=verification`                   |
| `src/components/admin/TeacherApproval.tsx`                                                                                                 | Profesor aprobat                 | `/account`                                    |
| Trigger DB `notify_admins_on_verification_request`                                                                                         | Cerere nouă verificare (admin)   | `/admin?tab=teachers`                         |
| `supabase/functions/notify-new-lesson`                                                                                                     | Lecție nouă                      | `/lesson/<lesson_id>` (sau `/` dacă lipsește) |
| `send-weekly-comeback`, `send-evening-reminder`, `send-streak-reminder`, `send-lives-refilled`, `send-teacher-reminder`, `_shared/push.ts` | Reminders generale               | rămân fără link sau primesc `/`               |


Notă: rutele exacte pentru tab-urile din `/account` și `/admin` le verific la implementare ca să se potrivească cu query params existente.

## Frontend

- `src/hooks/useNotifications.ts`: adaug `link?: string | null` în interfața `Notification`.
- `src/components/NotificationBell.tsx`: import `useNavigate`; la click pe notificare → `markAsRead(id)` + `navigate(n.link)` (+ închidere popover) dacă există link; altfel doar marchează ca citit (comportament actual).
- Pentru push native (FCM), `data: { type, ...id }` există deja parțial; opțional adaug și `link` în payload pentru deep-link când userul deschide din push (out-of-scope dacă vrei doar in-app — confirm mai jos).

## Întrebare

Vrei să tratez și deep-link-ul din push notification (când userul atinge push-ul nativ) sau doar comportamentul in-app la click pe clopoțel?  
Comportamentul in app