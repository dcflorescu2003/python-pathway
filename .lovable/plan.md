

# Scroll pe mobil — margini laterale pentru zona de scroll

## Problema
Pe mobil, elementele draggable au `touch-none` care blochează scroll-ul nativ. Drag-and-drop trebuie păstrat, dar utilizatorul nu poate da scroll pe pagină deoarece elementele ocupă toată lățimea ecranului.

## Soluția
Adăugăm o zonă liberă laterală (margini) pe care utilizatorul poate atinge pentru a face scroll, fără să activeze drag-and-drop. Practic, elementele de exercițiu vor fi mai înguste, lăsând o bandă de ~16-20px pe fiecare parte a ecranului care rămâne „scrollabilă".

### Modificări

**1. `src/components/exercises/OrderExercise.tsx`**
- Adăugare `mx-4` sau `px-4` pe containerul exercițiului, astfel încât elementele draggable nu ating marginile ecranului
- Zona laterală liberă permite scroll-ul nativ pe mobil

**2. `src/pages/LessonPage.tsx`**
- Adăugare `pb-24` pe zona `<main>` pentru a nu ascunde conținut sub feedback bar

**3. `src/pages/ManualLessonPage.tsx`**
- Aceeași ajustare de padding bottom

## Rezultat
- Drag-and-drop rămâne funcțional pe elementele în sine
- Utilizatorul poate face scroll atingând marginile laterale ale ecranului
- Butoanele ▲/▼ rămân ca alternativă

