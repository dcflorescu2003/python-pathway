# Verificare XP după o lecție pe mobil

## Situația curentă (verificată acum)

Cont: dcflorescu2003@gmail.com (Florescu Cosmin)

- XP curent: **15460**
- Lecții marcate ca finalizate: **576**
- Ultima activitate înregistrată: 19 august 2026 (restaurare în masă a progresului), nimic nou după
- Versiunea aplicației în cod: **1.117** (Android și iOS la fel), iar acordarea de XP pe server acceptă doar clienți de la această versiune în sus

Deci baza de comparație este clară: XP = 15460 înainte de lecția pe care urmează să o faci.

## Ce facem

1. Tu faci o lecție pe telefon (ideal una **deja finalizată anterior** și apoi una **nouă**, ca să testăm ambele cazuri).
2. Eu verific imediat după, direct în baza de date:
   - cât XP ai acum față de 15460
   - dacă lecția a fost înregistrată o singură dată sau de mai multe ori
   - ce scor a fost salvat și la ce oră

## Rezultat așteptat

- Lecție **refăcută** cu scor egal sau mai mic: **0 XP** acordat (doar scorul se poate actualiza dacă e mai bun)
- Lecție **nouă**: XP acordat exact o dată, în limita recompensei lecției (zeci de XP, nu sute/mii)
- Fără sărituri bruște de XP la sincronizare între telefon și web

## Dacă apare din nou XP gigantic

Investighez în ordine:
- dacă mecanismul de trimitere în așteptare de pe mobil („outbox”) retrimite aceeași lecție de mai multe ori
- dacă sincronizarea locală rescrie XP-ul din cloud în loc să-l respecte
- dacă versiunea instalată pe telefon este cu adevărat 1.117 (o versiune mai veche trimite XP pe care serverul ar trebui să-l refuze)

## Detalii tehnice

- Verificare pe `profiles.xp`, `completed_lessons` (lesson_id, score, completed_at) pentru user_id `e66e2524-...`
- XP-ul este decis exclusiv server-side de funcția `award_progress`, care este idempotentă și filtrată pe `p_client_version`
- Clientul trimite `APP_VERSION` din `src/lib/appVersion.ts` la fiecare acordare

Nu sunt necesare modificări de cod în acest pas — este strict verificare. Dacă apare o problemă, revin cu un plan de reparare.
