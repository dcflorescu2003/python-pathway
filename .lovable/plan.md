## Problemă

În exercițiul de Reorder din imagine apar 2 perechi de linii identice (`rez = c * p + rez` și `p = p * 10`), așa că elevul nu poate ști care e ordinea „corectă" — orice combinație între duplicate dă același cod.

## Soluție

Folosim câmpul `group` deja existent în `ExerciseEditor` + `OrderExercise` (vezi memoria [Order Groups](mem://features/exercise-logic/order-groups)): liniile cu același număr de grup devin **interschimbabile** la validare.

## Pași în UI admin (fără cod nou)

În editorul exercițiului, în dreptul fiecărei linii există un input mic numit **Grup** (lângă `order`). Setezi:

```
n = int(input())        order 1
p = 1                   order 1
rez = 0                 order 1
while n > 0:            order 2
  c = n % 10            order 3
  rez = c * p + rez     order 4   group 1   ← prima apariție
  p = p * 10            order 5   group 2   ← prima apariție
  rez = c * p + rez     order 6   group 1   ← duplicat, același grup
  p = p * 10            order 7   group 2   ← duplicat, același grup
  n = n // 10           order 7
print(rez)              order 8
```

Astfel `OrderExercise` va accepta orice permutare între cele două apariții ale lui `rez = c * p + rez` și între cele două apariții ale lui `p = p * 10`, dar va păstra restul ordinii strictă.

## Ce fac eu

1. Identific exercițiul în DB (caut în `exercises` un item de tip `order` cu liniile din imagine — îmi trebuie lecția sau ID-ul; alternativ aplici tu manual din UI după pașii de mai sus).
2. Dacă-mi spui ID-ul lecției/exercițiului, rulez un `UPDATE exercises SET data = ...` care setează `group: 1` pe cele 2 apariții ale `rez = c * p + rez` și `group: 2` pe cele 2 apariții ale `p = p * 10`, fără să modific altceva.

Spune-mi: vrei să-l aplici tu manual în UI (e doar completarea a 4 căsuțe `group`), sau îmi dai ID-ul lecției ca să rulez update-ul direct în DB?  
Aplic eu manual