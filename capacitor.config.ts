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
      // Auto-hide nativ după 2.5s ca plasă de siguranță, în caz că JS nu apucă să apeleze hide()
      launchShowDuration: 2500,
      launchAutoHide: true,
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
