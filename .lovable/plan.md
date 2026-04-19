

## Plan: Blocare shortcut-uri suspecte în testele cu fullscreen obligatoriu

### Comportament
Pe testele cu `require_fullscreen` activ, în timpul susținerii testului (după ce elevul a intrat în fullscreen), interceptez tastele/comenzile care ar putea ieși din fullscreen sau întrerupe testul. La fiecare tentativă, afișez un toast de avertisment în loc să las browserul/OS-ul să execute acțiunea.

### Shortcut-uri blocate (best-effort în browser/PWA)
- **Esc** — singurul mod browser de ieșire din Fullscreen API; preventDefault + warning
- **F11** — toggle fullscreen nativ browser
- **Ctrl/Cmd + T** — tab nou
- **Ctrl/Cmd + W** — închide tab
- **Ctrl/Cmd + N** — fereastră nouă
- **Ctrl/Cmd + Tab** / **Ctrl + Tab** — schimbare tab
- **Ctrl/Cmd + R**, **F5** — reload (ar pierde progresul)
- **Ctrl/Cmd + Shift + I**, **F12** — DevTools
- **Alt + Tab** — best-effort (OS-ul îl prinde de obicei; dacă nu reușim să blocăm, oricum auto-submit-ul existent se declanșează)
- **Click dreapta** — dezactivez context menu pe pagina testului

### Limitări reale (transparență)
Browserele și OS-urile **nu permit** blocarea garantată a Cmd+T, Cmd+W, Cmd+Q, Alt+Tab, Mission Control etc. dintr-o pagină web. `preventDefault` funcționează doar pentru taste pe care browserul nu le rezervă. Pentru cele rezervate, ne bazăm pe sistemul existent: ieșirea din fullscreen / pierderea focusului → auto-submit după 1s. Nu promit blocare 100%, ci „best-effort + auto-submit ca plasă de siguranță”.

### Implementare în `src/pages/TakeTestPage.tsx`
1. `useEffect` activ doar când `requireFullscreen && submission && !hasSubmitted` și `document.fullscreenElement` există.
2. `keydown` listener cu `preventDefault()` + `stopPropagation()` pentru combinațiile detectabile, urmat de `toast.warning("Shortcut interzis în timpul testului: <nume>")`.
3. `contextmenu` listener cu `preventDefault()` + warning.
4. `beforeunload` listener care cere confirmare la reload/close (warning standard browser).
5. Throttle pe toast (max 1 warning / 1.5s) ca să nu spameze dacă elevul ține tasta apăsată.
6. Cleanup complet la submit / unmount.

### Avertisment vizual
Extind banner-ul existent de avertizare cu o linie:
> 🛑 Shortcut-urile (Esc, F11, Ctrl/Cmd+T/W/R, F12) sunt blocate. Orice tentativă de ieșire trimite testul automat.

### Fișier modificat

| Fișier | Schimbare |
|---|---|
| `src/pages/TakeTestPage.tsx` | useEffect cu keydown/contextmenu/beforeunload listeners + toast throttle + extindere banner avertisment |

