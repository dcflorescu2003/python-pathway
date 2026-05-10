## Problem

Profesorul, după ce importă un test predefinit, deschide Preview-ul unui item în TestBuilder și vede:
- cerința redată ca text simplu pe un singur rând (fără formatare Markdown — `**bold**`, liste, paragrafe noi);
- pentru exercițiile de tip „Completează" nu apare **code_template-ul** cu spațiile libere (vede doar „Spațiu 1: ___");
- pentru probleme, descrierea este tăiată cu `line-clamp-4` și nu păstrează formatarea Markdown.

Cauza: `renderExercisePreview` și `renderProblemPreview` din `src/components/teacher/TestBuilder.tsx` folosesc `<p>` simplu și `line-clamp-4`, în loc de componenta `RichContent` care randează Markdown + cod.

## Schimbări (doar UI, doar `src/components/teacher/TestBuilder.tsx`)

1. Importă `RichContent` din `@/components/RichContent`.

2. În `renderExercisePreview`:
   - Înlocuiește `<p className="text-xs font-medium text-foreground">{ex.question || ex.statement}</p>` cu `<RichContent className="text-sm font-medium text-foreground">{ex.question || ex.statement}</RichContent>`.
   - Pentru `type === "fill"`: dacă `ex.code_template` există, afișează template-ul cu spațiile completate ca `___` (înlocuind `___` cu spații vizibile) într-un `<pre>` monospaced; altfel păstrează lista actuală „Spațiu N: ___".
   - Pentru `type === "quiz"`: randează `opt.text` cu `<RichContent inline>` ca să prindă cod inline.
   - Pentru `type === "order"`: păstrează randarea monospaced a liniilor.
   - Pentru `type === "match"`: păstrează formatul `left → ___`, dar randează `left` ca text (acceptă și inline code).

3. În `renderProblemPreview`:
   - Elimină `line-clamp-4` și `whitespace-pre-wrap` de pe descriere.
   - Înlocuiește `<p>` cu `<RichContent className="text-xs text-muted-foreground">{prob.description}</RichContent>`.
   - Dacă `prob.title` lipsește (cazul eval-bank, unde titlul e gol), nu mai afișa rândul de titlu (descrierea conține deja titlul ca `**...**`).

Niciun alt fișier nu se modifică. Logică de business / fetch / RPC / grading rămân neatinse.

## Verificare

- Deschide ca profesor un test creat din șablonul predefinit; click pe ochiul Preview la:
  - un item „Completează" → trebuie să apară code-template-ul (`x = 7\nprint(x > 3 ___ x < 5)`) cu spații marcate;
  - o problemă (de ex. „Campania de reciclare") → întreaga descriere cu `**bold**` randat și fără tăiere;
  - un quiz cu enunț pe mai multe rânduri (ex. cel cu `x = 2 + 3 * 4`) → blocul de cod afișat corect.
