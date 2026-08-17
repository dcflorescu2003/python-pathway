# Sitemap în Search Console + verificarea fluxului de evaluare

## 1. Sitemap „nu a putut fi citit"

Ce am verificat deja acum:

- `https://pyroskill.info/sitemap.xml` răspunde `200`, `text/xml`, XML valid, inclusiv cu User-Agent Googlebot.
- `robots.txt` este corect și conține linia `Sitemap: https://pyroskill.info/sitemap.xml`.
- Toate URL-urile din sitemap sunt pe același domeniu ca proprietatea.

Deci fișierul este accesibil public. Search Console raportează o eroare de citire fără motiv explicit, iar ultima citire e din 17.08 — foarte probabil o încercare eșuată din perioada avertismentului „Pagini înșelătoare" / a unei erori temporare de rețea, nu o problemă actuală de conținut.

Pași propuși:

1. Citirea stării exacte a sitemap-ului prin API-ul Search Console (status, numărare erori/avertismente, data ultimei citiri) pentru a vedea ce raportează Google acum, nu ce apare în captură.
2. Dacă starea rămâne „couldn't fetch": ștergerea intrării `/sitemap.xml` din proprietate și retrimiterea ei, ca Google să reia procesarea de la zero.
3. Recitirea statusului după retrimitere și raportarea rezultatului.

Nu propun modificări la conținutul sitemap-ului sau la robots — sunt deja corecte. Dacă după retrimitere Google tot raportează eroare, singura acțiune rămasă este așteptarea unei noi treceri a crawlerului (uneori durează câteva zile după ridicarea unui avertisment de securitate).

## 2. Verificarea că modificările de securitate nu afectează evaluarea

Am revizuit deja logica și pare intactă:

- Corectarea automată și AI rulează în funcția `grade-submission` cu cheia de serviciu → triggerele de protecție o lasă să scrie scorurile.
- Renotarea manuală a profesorului scrie din interfață cu contul profesorului → triggerul recunoaște profesorul proprietar al testului și permite modificarea.
- Elevul nu mai are drept direct de update, dar toate acțiunile lui (salvare draft la 30s, contorizarea ieșirilor din test, marcarea întreruperii, reluarea testului) trec prin funcții securizate care nu ating coloanele protejate.

Verificare propusă (rulare efectivă, nu doar citire de cod), pe date de test:

1. Simulez un ciclu complet: profesor creează/atribuie test → elev începe testul → salvare draft → întrerupere și reluare → trimitere → corectare automată.
2. Confirm că scorul, punctajul maxim și feedback-ul se scriu efectiv în baza de date după trimitere.
3. Testez renotarea manuală a unui item de către profesor și recalcularea totalului.
4. Testez că un elev nu își poate modifica scorul (încercare directă respinsă/anulată).
5. Verific eliberarea rezultatelor și pagina de review a elevului.

Dacă apare vreo blocare, o repar în aceeași rundă (ajustare de trigger sau de RPC), fără să slăbesc protecția scorurilor.
