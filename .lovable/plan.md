

## Plan

Tab implicit la deschiderea paginii Cont:
- **Profesor** (orice `teacher_status`) → tab "Clase"
- **Elev înscris într-o clasă** (`isClassMember === true`) → tab "Elev"
- **Elev fără clasă** → comportament actual (neschimbat, probabil "Profil")

### Implementare

În containerul de tab-uri al paginii Cont, derivez tab-ul inițial după ce profilul s-a încărcat:

```ts
useEffect(() => {
  if (initialized) return;
  if (teacherStatus) setActiveTab("classes");
  else if (isClassMember) setActiveTab("student");
  // altfel: lasă default-ul curent
  setInitialized(true);
}, [teacherStatus, isClassMember]);
```

Setarea se face o singură dată, ca să nu suprascriu alegerea manuală a utilizatorului.

### Fișier modificat

| Fișier | Schimbare |
|--------|-----------|
| Containerul tab-urilor din pagina Cont (identific exact în default mode — probabil `src/pages/AuthPage.tsx` sau un `AccountTabs`) | State inițial `activeTab` derivat din `teacherStatus` + `isClassMember` |

