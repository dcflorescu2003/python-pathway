

Simple version bump. User is on v54 on other tracks, so next must be 55.

## Plan: Bump versiune la 55

**`android/app/build.gradle`**
- `versionCode 49` → `versionCode 55`
- `versionName "1.49"` → `versionName "1.55"`

Atât. După aceea: `npm run build` → `npx cap sync android` → build AAB semnat în Android Studio → upload pe Alpha.

