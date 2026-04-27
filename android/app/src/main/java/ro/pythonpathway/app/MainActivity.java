package ro.pythonpathway.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Enable edge-to-edge rendering (Android 15+ compatible, no deprecated APIs)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        // Inject system bar insets into the WebView as CSS variables so the
        // web layer can avoid status bar / navigation bar / gesture areas
        // on devices where env(safe-area-inset-*) returns 0 (most Androids).
        final View root = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            int topPx = Math.round(bars.top / density);
            int rightPx = Math.round(bars.right / density);
            int bottomPx = Math.round(bars.bottom / density);
            int leftPx = Math.round(bars.left / density);
            applySafeAreaToWebView(topPx, rightPx, bottomPx, leftPx);
            return windowInsets;
        });
    }

    private void applySafeAreaToWebView(int top, int right, int bottom, int left) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        final String js =
            "(function(){var s=document.documentElement.style;" +
            "s.setProperty('--android-sait','" + top + "px');" +
            "s.setProperty('--android-sair','" + right + "px');" +
            "s.setProperty('--android-saib','" + bottom + "px');" +
            "s.setProperty('--android-sail','" + left + "px');})();";
        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(js, null)
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Emit focus events to the web layer so the test page can detect
        // the notification shade being pulled down (which doesn't fire
        // visibilitychange or blur in Android WebView).
        if (getBridge() != null && getBridge().getWebView() != null) {
            final String event = hasFocus ? "pyro:native_focus_gained" : "pyro:native_focus_lost";
            getBridge().getWebView().post(() -> {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('" + event + "'));",
                    null
                );
            });
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN &&
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");

            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin handle is null");
                return;
            }

            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is invalid");
                return;
            }

            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
