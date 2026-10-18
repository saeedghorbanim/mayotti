import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mayotti.app',
  appName: 'Mayotti',
  webDir: 'dist',
  ios: {
    // Never auto-adjust content insets so CSS env(safe-area-inset-*) values work correctly
    contentInsetAdjustmentBehavior: 'never',
    // The page itself never scrolls; only the views' own containers do. This
    // stops the whole app from being dragged sideways or under the status bar.
    scrollEnabled: false,
  },
};

export default config;
