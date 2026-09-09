# ProGuard / R8 rules for the PyRo Android app.
# R8 (minifyEnabled true) obfuscates and shrinks the release build.

# Keep line numbers for readable crash reports, hide original file names.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- Capacitor core & plugins (loaded via reflection / annotations) ---
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class ro.pythonpathway.** { *; }

# Cordova plugins bridged through Capacitor
-keep class org.apache.cordova.** { *; }

# JavaScript interfaces exposed to the WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Google Play Billing ---
-keep class com.android.billingclient.** { *; }

# --- Firebase / Google Play Services (push notifications, AdMob) ---
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**

# --- Misc: annotations & generics used through reflection ---
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
