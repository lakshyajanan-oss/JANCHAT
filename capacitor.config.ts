import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lakshya.janchat',
  appName: 'JANChat',
  webDir: 'public',
  server: {
    url: 'https://janchat.onrender.com',
    cleartext: true
  }
};

export default config;
