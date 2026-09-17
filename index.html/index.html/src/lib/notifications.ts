/**
 * Turn on phone notifications from either the installed app or the browser.
 *
 * - In the Capacitor Android/iOS build the WebView exposes `window.Capacitor`;
 *   we use the native `@capacitor/local-notifications` plugin so notifications
 *   show on the device like any other app.
 * - In a normal browser / installed PWA we fall back to the Web Notifications
 *   API.
 *
 * Everything is guarded for SSR (`typeof window`) and the native plugin is
 * imported lazily so the web bundle never touches it at runtime.
 */

export type NotifResult = "granted" | "denied" | "unsupported";
export type PermissionState = "granted" | "denied" | "default" | "unsupported";

type CapacitorGlobal = { isNativePlatform?: () => boolean };

function nativeCapacitor(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap && cap.isNativePlatform?.() ? cap : null;
}

/** True inside the installed Capacitor app (Android/iOS), false in a browser. */
export function isNativeApp(): boolean {
  return nativeCapacitor() !== null;
}

/**
 * Whether notifications are actually active: the saved preference AND a usable
 * OS permission. On the web that means the browser permission is granted; in the
 * native app the permission is not synchronously readable here, so the saved
 * preference is trusted.
 */
export function notificationsActive(alertsOn: boolean | undefined): boolean {
  if (!alertsOn) return false;
  if (isNativeApp()) return true;
  return permissionState() === "granted";
}

/** Whether notifications can be turned on at all in this runtime. */
export function notificationsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return isNativeApp() || typeof Notification !== "undefined";
}

/**
 * Best-effort current permission for the browser path. The native path does not
 * expose a synchronous permission read here, so it reports "default" until the
 * user acts (the request result is authoritative).
 */
export function permissionState(): PermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (isNativeApp()) return "default";
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PermissionState;
}

/** Ask the OS/browser to allow notifications. */
export async function requestNotificationPermission(): Promise<NotifResult> {
  if (typeof window === "undefined") return "unsupported";
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const res = await LocalNotifications.requestPermissions();
      return res.display === "granted" ? "granted" : "denied";
    } catch {
      return "unsupported";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  try {
    const perm = await Notification.requestPermission();
    return perm === "granted" ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

/** Show a notification now (used for the "test" button and confirmations). */
export async function showLocalNotification(title: string, body: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [
          { id: Math.floor(Math.random() * 100_000) + 1, title, body },
        ],
      });
    } catch {
      /* plugin missing from the native build — nothing to show */
    }
    return;
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, { body });
    } catch {
      /* some browsers require a ServiceWorkerRegistration; ignore */
    }
  }
}
