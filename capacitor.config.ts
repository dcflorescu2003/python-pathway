import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ro.pythonpathway.app',
  appName: 'PyRo',
  webDir: 'dist',
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        apple: false,
        facebook: false,
        twitter: false,
      },
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
