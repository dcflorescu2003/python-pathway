## Obiectiv
Adăugăm un buton "Previzualizează test" chiar deasupra butonului "Creează test" din `TestBuilder`, care deschide un pop-up cu întregul test așa cum îl va vedea elevul, cu ambele variante afișate în paralel când `variantMode === "manual"`.

## Modificări

### `src/components/teacher/TestBuilder.tsx`
1. Adaug un state nou: `const [fullPreviewOpen, setFullPreviewOpen] = useState(false);`.
2. Import `Dialog, DialogContent, DialogHeader, DialogTitle` din `@/components/ui/dialog` și iconița `Eye` (deja importată).
3. Chiar deasupra `<Button onClick={handleSave} ...>` (linia 1358), adaug:
   - Un `<Button variant="outline" onClick={() => setFullPreviewOpen(true)} disabled={items.length === 0}>` cu textul "Previzualizează test" și iconița `Eye`.
4. La finalul componentei (lângă celelalte dialoguri), adaug `<Dialog open={fullPreviewOpen} onOpenChange={setFullPreviewOpen}>` cu:
   - `DialogContent` mare (`max-w-5xl max-h-[90vh] overflow-y-auto`).
   - Header cu titlul testului + info (nr. itemi, timp limită dacă e activ, puncte din oficiu).
   - Corp condiționat:
     - Dacă `variantMode === "manual"`: grid cu 2 coloane, câte o coloană pentru Nr. 1 (`variant1Items`) și Nr. 2 (`variant2Items`), fiecare item numerotat cu `renderItemPreview(item)` expandat permanent, plus label + puncte + total pe variantă.
     - Altfel: listă unică cu toate `items`, numerotată, fiecare cu `renderItemPreview(item)` expandat.
5. Nu modific logica de salvare, nu ating alte componente.

## Note tehnice
- Reutilizăm `renderItemPreview`, `getItemLabel`, `getItemIcon`, `variant1Items`, `variant2Items` existente — deci nu duplicăm cod.
- Dialogul e pur UI, fără apeluri de rețea sau schimbări în DB.
- Butonul e dezactivat când nu există itemi (`items.length === 0`).
