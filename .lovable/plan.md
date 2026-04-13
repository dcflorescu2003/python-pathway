

## Plan: Restricții TestBuilder pentru profesori neverificați + navigare înapoi corectă

### 1. Restricții conținut în TestBuilder

**Ce se schimbă:** TestBuilder primește `teacherStatus` ca prop (din TeacherPage). Dacă statusul nu este `verified`:
- Tab-ul **"Predefinite"** (templates) este ascuns sau dezactivat cu mesaj explicativ
- Tab-urile **"Exerciții"** și **"Probleme"** rămân vizibile (profesorii neverificați pot vedea întrebările din lecții și probleme)
- Tab-ul **"Custom"** rămâne vizibil

**Fișiere:** `TestBuilder.tsx`, `TeacherPage.tsx`

### 2. Navigare înapoi corectă

**Problema:** Butonul "Înapoi" din header-ul TeacherPage face `navigate("/")`. După crearea/editarea unui test, `onBack` revine la lista de teste — asta e deja corect.

**Ce se schimbă:** 
- Header-ul TeacherPage: butonul "Înapoi" folosește `navigate(-1)` în loc de `navigate("/")` pentru a reveni la pagina anterioară (de ex. pagina de cont)
- După salvarea testului în TestBuilder, `onBack()` deja se apelează — funcționează corect

### Modificări fișiere

| Fișier | Schimbare |
|--------|-----------|
| `src/components/teacher/TestBuilder.tsx` | Adaugă prop `teacherStatus`, ascunde tab-ul "Predefinite" dacă nu e `verified` |
| `src/pages/TeacherPage.tsx` | Pasează `teacherStatus` la TestBuilder, schimbă `navigate("/")` cu `navigate(-1)` |

