import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.catchdaddy.app',
  appName: 'CatchDaddy',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },

  server: {
    url: 'https://fishing-app-46485.web.app',
    cleartext: false,
  },
};

export default config;
