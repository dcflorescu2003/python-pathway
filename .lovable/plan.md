# XP uriaș pe telefon — diagnostic și plan

## Ce arată datele acum (verificat)

Cont: dcflorescu2003@gmail.com

| | În cloud (adevărul) | Pe ecranul telefonului |
|---|---|---|
| XP | **15.460** | **48.348** |
| Lecții finalizate | 576 înregistrări | 203 |
| Streak | 130 | 130 |

Cloud-ul nu s-a modificat deloc azi (ultima activitate: 19–20 august). Deci XP-ul de 48.348 **nu vine de la server** — e o valoare veche rămasă în memoria locală a telefonului.

## De ce se întâmplă

În versiunea 1.117, XP-ul este decis exclusiv de server, iar la încărcare aplicația trebuie să ia XP-ul din cloud (nu maximul dintre local și cloud). Faptul că telefonul afișează 48.348 înseamnă una din două:

1. Pe telefon este instalată o **versiune mai veche** decât 1.117 (cea veche păstra XP-ul local umflat), sau
2. Încărcarea din cloud a eșuat la pornire și aplicația a rămas pe copia locală.

Nu pot distinge între cele două fără să știu versiunea instalată.

## Ce recomand să faci acum (înainte de lecție)

1. Intră în **Cont** și spune-mi ce versiune afișează aplicația.
2. Închide complet aplicația și redeschide-o, cu internet activ. Dacă XP-ul devine ~15.460, era doar o încărcare eșuată.
3. Abia apoi fă lecția — altfel nu putem interpreta rezultatul.

Nu face lecția cât timp ecranul arată 48.348: orice creștere ar fi imposibil de atribuit corect.

## Ce fac eu în funcție de rezultat

**Dacă versiunea e mai veche decât 1.117:** nu e un bug nou — trebuie doar instalat build-ul actual; verificăm din nou după update.

**Dacă versiunea e 1.117 și XP-ul rămâne 48.348 după repornire:** e un bug real de încărcare și îl repar așa:
- forțez la pornire aplicarea XP-ului din cloud peste copia locală, chiar dacă cererea de profil întârzie
- adaug o „reparație” unică: dacă XP-ul local diferă de cel din cloud, cel local este suprascris și snapshot-ul vechi este curățat
- adaug un jurnal în consolă cu XP local vs. XP cloud, ca să pot confirma rapid

**După lecție** verific în baza de date:
- XP-ul nou față de 15.460 (creștere de zeci, nu mii)
- dacă lecția a fost înregistrată o singură dată
- că o lecție refăcută nu mai dă XP

## Detalii tehnice

- `profiles.xp` = 15460, `completed_lessons` = 576 rânduri unice pentru `e66e2524-…`
- `mergeProgress` (src/hooks/useProgress.ts) ia deja `xp: b.xp` (cloud) — corect
- XP local afișat = XP cloud + `pendingQueueXp` (outbox); o coadă blocată ar putea umfla afișarea, deci verific și numărul de itemi în așteptare
- Diferența de 203 vs 576 lecții este separată și cunoscută: multe `lesson_id` din cloud nu mai există în curriculum după reimporturi

Nu modific cod în acest pas — întâi confirmăm versiunea instalată.
