

## Plan: Rename app to PyRo with tricolor "Ro"

### Summary
Rename all instances of "PyLearn" to "PyRo" across the codebase. The "Ro" part will be styled with the Romanian tricolor (blue, yellow, red) using a CSS gradient or individual letter coloring.

### Visual approach
- "Py" renders in the existing green/cyan gradient
- "Ro" renders with Romanian flag colors: blue (#002B7F), yellow (#FCD116), red (#CE1126) via a CSS gradient on those two letters

### Files to update

1. **`src/components/states/SplashScreen.tsx`** — Split "PyRo" into `<span>Py</span><span class="text-tricolor">Ro</span>` with tricolor styling
2. **`src/pages/Index.tsx`** — Same split for the header logo text
3. **`src/components/PremiumDialog.tsx`** — "PyRo Premium"
4. **`src/index.css`** — Add `.text-tricolor` utility with Romanian flag gradient (`background: linear-gradient(90deg, #002B7F, #FCD116, #CE1126)` + `background-clip: text`)
5. **`index.html`** — Update `<title>`, meta tags (description, author, og:title, twitter:site, apple-mobile-web-app-title)
6. **`vite.config.ts`** — PWA manifest name/short_name
7. **`capacitor.config.ts`** — appName
8. **`android/app/src/main/res/values/strings.xml`** — app_name, title_activity_main
9. **`src/hooks/useProgress.ts`** — storage key (keep backward compat alias)
10. **`src/data/schools.ts`** — storage key
11. **`src/App.tsx`** — splash session storage key

### CSS utility
```css
.text-tricolor {
  background: linear-gradient(90deg, #002B7F 0%, #002B7F 33%, #FCD116 33%, #FCD116 66%, #CE1126 66%, #CE1126 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Component pattern
```tsx
{/* Header / Splash */}
<h1 className="text-xl font-bold font-mono">
  🐍 <span className="text-gradient-primary">Py</span><span className="text-tricolor">Ro</span>
</h1>
```

