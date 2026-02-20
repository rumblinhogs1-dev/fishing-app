import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fishinglog.app',
  appName: "Crawdaddy's Catch",
  webDir: 'dist',

  // Uncomment the block below for live-reload during development:
  // 1. Run `npm run dev` to start the Vite dev server
  // 2. Replace the URL with your local network IP (run `ipconfig getifaddr en0` on macOS)
  // 3. Run `npx cap sync` then re-launch the native IDE
  //
  // server: {
  //   url: 'http://192.168.1.X:5173',
  //   cleartext: true,
  // },
};

export default config;
