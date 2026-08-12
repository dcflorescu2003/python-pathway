# Cartonaș de verificare pentru profesori + notificări dedicate

## Situația actuală (verificată)
- Profesorii neverificați primesc doar o notificare push zilnică (funcția `send-unverified-teacher-reminder`). Nu există niciun cartonaș vizual în aplicație.
- Pagina principală (`Index.tsx`) este aceeași pe web și pe mobil, deci un cartonaș afișat acolo apare în ambele variante.
- Funcțiile de memento pentru streak (`send-streak-reminder`, `send-evening-reminder`, `send-weekly-comeback`) selectează toate profilurile, fără să excludă profesorii — deci profesorii primesc și acum notificări de streak.

## Ce construim

### 1. Cartonaș de instrucțiuni pentru verificarea contului
- Apare pe pagina principală pentru orice cont cu rol de profesor al cărui status nu este „verificat” (inclusiv „nepornit” și „în așteptare”).
- Reutilizează cartonașul animat existent (același stil ca sfaturile motivaționale): rămâne minim 5 secunde, are bară de progres și buton de închidere manuală.
- Text: pași scurți pentru verificare (deschide Cont > Profesor, alege metoda de validare, trimite dovada), plus buton/acțiune care duce direct la pagina de verificare.
- Se afișează maxim o dată pe zi per cont, ca să nu devină deranjant; dispare definitiv după verificare.
- Apare identic în varianta web și în aplicația mobilă (aceeași pagină principală).

### 2. Notificări dedicate profesorilor
- Profesorii nu mai primesc mementouri de streak / seară / revenire săptămânală.
- Profesorii neverificați continuă să primească doar mementoul de verificare a contului (funcția existentă, nemodificată ca text).

## Detalii tehnice
- Componentă nouă `src/components/teacher/TeacherVerificationTipCard.tsx` (sau reutilizare directă a `MotivationalTipCard` cu conținut dedicat), cu `durationMs` de minim 5000 ms și `onDismiss`.
- Hook nou `useTeacherVerificationTip` care:
  - citește `profiles.is_teacher` și `profiles.teacher_status`;
  - condiție de afișare: `is_teacher = true` și `teacher_status !== 'verified'`;
  - throttling zilnic prin `localStorage`, cheie namespaced pe `user.id`.
- Montare în `src/pages/Index.tsx` în același `AnimatePresence` cu cartonașele existente, cu prioritate față de sfaturile motivaționale (nu se afișează două simultan).
- Edge functions: filtru `is_teacher = false` (sau excluderea profesorilor) în interogările din `send-streak-reminder`, `send-evening-reminder` și `send-weekly-comeback`, atât pentru push cât și pentru notificările in-app inserate în tabelul de notificări.
