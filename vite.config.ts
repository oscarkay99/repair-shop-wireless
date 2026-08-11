import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";
import { VitePWA } from "vite-plugin-pwa";
// import { readdyJsxRuntimeProxyPlugin } from "./vite.jsx-runtime-proxy";

const base = process.env.BASE_PATH || "/";
const isPreview = process.env.IS_PREVIEW ? true : false;
// Deploy pipeline sets GITHUB_SHA; falls back to a timestamp for local
// builds so `npm run build` still produces a distinct id every time.
const buildId = process.env.GITHUB_SHA || String(Date.now());
//const proxyPlugins = isPreview ? [readdyJsxRuntimeProxyPlugin()] : [];

// Emits out/version.json so the running app can poll for a newer deploy
// and prompt staff to refresh, instead of silently running a stale bundle.
function writeVersionFile() {
  return {
    name: "write-version-file",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: JSON.stringify({ buildId }) });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __BUILD_ID__: JSON.stringify(buildId),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
  },
  plugins: [
    // ...proxyPlugins,
    react(),
    writeVersionFile(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["wireless-mark.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Wireless — Command Center",
        short_name: "Wireless",
        description: "Repair ticket management, inventory, invoicing, and staff tools for Wireless.",
        theme_color: "#EC0118",
        background_color: "#ffffff",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // version.json is polled with cache: 'no-store' specifically to
        // detect a new deploy while a tab's been open (useNewVersionAvailable)
        // — precaching it here would serve a stale copy back to that exact
        // check and defeat the whole mechanism. Nothing else here should ever
        // touch api.wirelesscares.com either: no runtimeCaching entries are
        // defined for it, so ticket/inventory/payment data is never served
        // from the service worker, only ever fetched live.
        globIgnores: ["version.json"],
        navigateFallbackDenylist: [/^\/version\.json$/],
      },
    }),
    AutoImport({
      imports: [
        {
          react: [
            ["default", "React"],
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
            "useDeferredValue",
            "useId",
            "useInsertionEffect",
            "useSyncExternalStore",
            "useTransition",
            "startTransition",
            "lazy",
            "memo",
            "forwardRef",
            "createContext",
            "createElement",
            "cloneElement",
            "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "NavLink",
            "Navigate",
            "Outlet",
          ],
        },
        // React i18n
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
