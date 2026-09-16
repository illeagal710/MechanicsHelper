import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { I18nProvider } from "@/lib/i18n-context";
import { ThemeProvider } from "@/lib/theme-context";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "Mechanics Helper";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#071834" },
      { name: "description", content: "Book auto repair, share a shop QR, and track the job." },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <Outlet />
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  ),
});
