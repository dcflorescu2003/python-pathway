
1. Fix `Order` in `src/pages/TakeTestPage.tsx` by replacing the current arrow-only `TestOrderRenderer` with a real sortable list built on the existing `@dnd-kit` stack already used elsewhere in the project.
   - Use `DndContext` + `SortableContext` + `useSortable`
   - Add `PointerSensor`, `TouchSensor`, and `KeyboardSensor` so it works with mouse, touch, and keyboard
   - Keep the current ▲/▼ buttons as an accessible fallback, but make drag-and-drop the primary interaction
   - Preserve the stored answer shape `{ order: [...] }` so grading stays compatible
   - Match the lesson/app visual behavior: drag handle, lifted active item, smooth reorder, no broken mobile scrolling

2. Make the order interaction reliable on mobile/Android.
   - Add a dedicated drag handle area instead of making the whole card draggable
   - Use a touch activation constraint so normal vertical scrolling doesn’t accidentally start dragging
   - Ensure the handle and buttons keep proper focus states and 44px+ tap targets
   - Keep grouped-order compatibility untouched, since correctness is still evaluated server-side from the saved line order

3. Fix auto-submit when the Android notification shade is opened from a native build.
   - Keep the current web fallbacks (`visibilitychange`, `blur/focus`, `document.hasFocus`, app background/pause)
   - Add a native Android signal because the current browser-level events do not fire when swiping down notifications in the live build
   - Implement a lightweight native bridge/plugin that listens for Android window focus changes from `MainActivity` and emits `focus_lost` / `focus_gained` to the web layer
   - In `TakeTestPage.tsx`, start the 1-second auto-submit timer on native `focus_lost` and cancel it on `focus_gained`
   - Treat this native signal as the source of truth on Android, while preserving existing fallbacks for web/PWA

4. Update auto-submit reason handling so teacher results stay readable.
   - Add a distinct reason like `android_notification_shade` or `native_window_focus_lost`
   - Update `src/components/teacher/TestResults.tsx` so teachers see a clear Romanian label instead of a generic fallback
   - Keep existing reasons (`tab_hidden`, `app_background`, etc.) unchanged

5. Files to modify.
   - `src/pages/TakeTestPage.tsx`
     - replace `TestOrderRenderer`
     - wire native notification-shade leave detection into the existing auto-submit effect
   - `android/app/src/main/java/ro/pythonpathway/app/MainActivity.java`
     - expose Android window-focus changes to the web app
   - possibly a small native Capacitor plugin file under `android/app/src/main/java/...` if needed for clean event delivery
   - `src/components/teacher/TestResults.tsx`
     - add label for the new auto-submit reason

6. Verification after implementation.
   - In the browser preview: confirm order items can be reordered by drag and by keyboard/buttons
   - In Android build: confirm dragging works with touch and that opening notifications for >1s triggers auto-submit
   - Confirm a short accidental swipe/open-close under 1 second does not submit
   - Confirm submitted tests still save the correct `{ order: [...] }` payload and problem/test renderers remain unchanged
