import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mayotti.app',
  appName: 'Mayotti',
  webDir: 'dist',
  ios: {
    // Never auto-adjust content insets so CSS env(safe-area-inset-*) values work correctly
    contentInsetAdjustmentBehavior: 'never',
  },
};

export default config;
