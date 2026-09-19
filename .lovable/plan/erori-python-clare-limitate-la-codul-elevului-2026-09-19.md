# Erori Python clare, limitate la codul elevului

## Obiectiv
Când rularea codului eșuează, elevul va vedea doar informația utilă din propriul fișier, de exemplu:

```text
Linia 1: NameError: name 'dd' is not defined
```

Nu vor mai apărea căile interne Pyodide, fișierele interpretului, apelurile JavaScript sau întregul traceback tehnic.

## Implementare
1. **Identificarea codului elevului ca fișier separat**
   - Codul va fi compilat și executat cu numele logic `main.py`.
   - Astfel, Python va raporta corect linia din codul elevului, inclusiv pentru erori de sintaxă și erori apărute în funcții.

2. **Filtrarea centralizată a erorilor**
   - Se adaugă un formator unic în mecanismul existent de rulare Python.
   - Din traceback se păstrează doar ultimul cadru relevant din `main.py`, numărul liniei, tipul erorii și mesajul Python.
   - Pentru erorile de sintaxă se păstrează și indicația utilă despre poziția greșelii, fără detalii interne.
   - Mesajul existent pentru depășirea limitei de 10 secunde rămâne clar și neschimbat.
   - Dacă eroarea nu provine din codul elevului, se afișează un mesaj scurt și sigur, nu detaliile motorului.

3. **Aplicare uniformă**
   - Problemele individuale, problemele din lecții și problemele din teste vor primi deja mesajul curățat prin mecanismul comun.
   - Nu se schimbă punctajul, cazurile de test, evaluarea, răspunsurile salvate sau informațiile afișate profesorilor după predare.

## Verificare
- Teste pentru `NameError`, `SyntaxError`, eroare într-o funcție la o linie ulterioară, împărțire la zero și timeout.
- Confirmare că mesajele nu mai conțin `pyodide`, `_base.py`, `<exec>`, `Traceback` sau căi interne.
- Verificare într-o problemă și într-un test că numărul liniei corespunde editorului elevului.
