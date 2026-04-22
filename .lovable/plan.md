

## Plan: Add iOS native focus bridge for test auto-submit parity

### What's missing

On Android, `MainActivity.onWindowFocusChanged` emits `pyro:native_focus_lost` / `pyro:native_focus_gained` to the web layer, which triggers test auto-submit when the notification shade or Control Center is opened. On iOS, `AppDelegate.swift` has empty `applicationWillResignActive` / `applicationDidBecomeActive` methods that do nothing — no events reach the web layer.

The web-side listener in `TakeTestPage.tsx` already handles `pyro:native_focus_lost` and `pyro:native_focus_gained`, so only the iOS native side needs the bridge.

### Changes

**File: `ios/App/App/AppDelegate.swift`**

Add JavaScript event dispatching in the two existing lifecycle methods:

- `applicationWillResignActive` — fires when the user opens Control Center, Notification Center, receives a phone call, or pulls down the status bar. Emit `pyro:native_focus_lost` to the WebView.
- `applicationDidBecomeActive` — fires when the app regains focus. Emit `pyro:native_focus_gained` to cancel the auto-submit timer.

Implementation: access the Capacitor bridge's WebView via `window?.rootViewController` (cast to `CAPBridgeViewController`), then call `webView?.evaluateJavaScript("window.dispatchEvent(new Event('pyro:native_focus_lost'))")` — mirroring exactly what Android does.

**File: `src/pages/TakeTestPage.tsx`**

No changes needed — the listeners for `pyro:native_focus_lost` / `pyro:native_focus_gained` are already wired at lines 416-419.

**File: `src/components/teacher/TestResults.tsx`**

No changes needed — the `native_window_focus_lost` reason label already covers both platforms.

### Summary

| Platform | Trigger | Event emitted | Already handled in web |
|----------|---------|---------------|----------------------|
| Android | `onWindowFocusChanged(false)` | `pyro:native_focus_lost` | Yes |
| iOS (new) | `applicationWillResignActive` | `pyro:native_focus_lost` | Yes |
| iOS (new) | `applicationDidBecomeActive` | `pyro:native_focus_gained` | Yes |

Single file change: `ios/App/App/AppDelegate.swift`. After merging, run `npx cap sync ios`.

