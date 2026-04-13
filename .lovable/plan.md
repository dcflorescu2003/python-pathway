

## Plan: Drag-and-drop reordonare + preview întrebări în secțiunea "Itemi selectați"

### Modificări în `src/components/teacher/TestBuilder.tsx`

### 1. Drag-and-drop pentru reordonarea itemilor selectați

Secțiunea "Itemi selectați" (liniile 822-859) are deja un `GripVertical` icon dar fără funcționalitate. Adăugăm HTML5 drag-and-drop (identic cu pattern-ul din `TakeTestPage` / `OrderExercise`):

- Adăugăm un `dragIdx` ref
- Pe fiecare item: `draggable`, `onDragStart`, `onDragOver`, `onDragEnd`
- La drop, mutăm itemul în `items` array și actualizăm `sort_order`
- Funcționează atât în modul shuffle cât și manual (lista e unică, variantele se filtrează doar la preview)

### 2. Buton Eye (preview) pe fiecare item selectat

Adăugăm un buton `Eye` (similar cu cel din browser-ul de exerciții, linia 586-589) pe fiecare item din lista "Itemi selectați". La click:

- Toggle `previewItemId` pe acel item
- Sub item, afișăm `renderExercisePreview()` sau `renderProblemPreview()` sau un preview custom (pentru `custom_data`) — funcțiile există deja (liniile 218-270)
- Pentru custom items, extragem datele din `item.custom_data` și le pasăm la `renderExercisePreview`

### 3. Preview în secțiunea variant preview (Nr. 1 / Nr. 2)

Adăugăm același buton Eye pe fiecare item din preview-ul variantelor (liniile 862-905), cu aceeași logică de expand/collapse.

### Fișiere modificate
- `src/components/teacher/TestBuilder.tsx` — singura modificare

