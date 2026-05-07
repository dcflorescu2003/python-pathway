import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.pythonpathway.app',
  appName: 'PyRo',
  webDir: 'dist',
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        apple: true,
        facebook: false,
        twitter: false,
      },
    },
    SplashScreen: {
      // Splash-ul rămâne vizibil până când JS confirmă că primul frame e pictat.
      // Plasă lungă (8s) ca pe device lente după update să nu dispară prea devreme.
      launchShowDuration: 8000,
      launchAutoHide: false,
      backgroundColor: "#0f1219",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#22c55e",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
