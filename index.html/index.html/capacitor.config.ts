import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Google Play application id (Android package name).
 * Reverse-DNS of mechanicshelper.app — do not change after the first Play upload.
 */
export const PLAY_APP_ID = "app.mechanicshelper";
export const PLAY_APP_NAME = "Mechanics Helper";
export const LIVE_ORIGIN = "https://mechanicshelper.app";

const NAVY = "#071834";

const config: CapacitorConfig = {
  appId: PLAY_APP_ID,
  appName: PLAY_APP_NAME,
  // Fallback shell only. v1 loads the live site so Railway deploys ship without a new AAB.
  webDir: "native-www",
  backgroundColor: NAVY,
  android: {
    allowMixedContent: false,
    backgroundColor: NAVY,
    adjustMarginsForEdgeToEdge: "auto",
    buildOptions: {
      releaseType: "AAB",
    },
  },
  server: {
    // HTTPS only. Do not set cleartext — the store app must not load http://.
    url: LIVE_ORIGIN,
    androidScheme: "https",
    allowNavigation: ["mechanicshelper.app", "www.mechanicshelper.app"],
    errorPath: "offline.html",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: NAVY,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: NAVY,
    },
  },
};

export default config;
