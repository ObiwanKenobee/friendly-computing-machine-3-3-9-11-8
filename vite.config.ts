import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [
      react(),
    ],

    resolve: {
      alias: {
        "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src"),
      },
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
      preserveSymlinks: false,
      mainFields: ["browser", "module", "main"],
      conditions: ["browser", "module", "import", "default"],
    },

    define: {
      __DEV__: !isProd,
      __PROD__: isProd,
      __SITE_URL__: JSON.stringify(
        process.env.VITE_SITE_URL || "https://quantumvest.com"
      ),
      __ANALYTICS_ID__: JSON.stringify(
        process.env.VITE_ANALYTICS_ID || "GA_ID"
      ),
      global: "globalThis",
      "process.env": "{}",
      process: JSON.stringify({ env: {} }),
    },

    build: {
      target: "es2015",
      minify: isProd ? "esbuild" : false,
      sourcemap: process.env.GENERATE_SOURCEMAP !== "false",
      chunkSizeWarningLimit: 1000,
      assetsDir: "assets",
      emptyOutDir: false,

      rollupOptions: {
        output: {
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },


    },

    server: {
      port: 3001,
      host: true,
      cors: true,
      strictPort: false,
      hmr: {
        port: 3002,
        overlay: false,
      },
      fs: {
        strict: false,
        allow: [".."],
      },
      watch: {
        usePolling: false,
        ignored: ["**/node_modules/**", "**/.git/**"],
      },
      warmup: {
        clientFiles: [
          "./src/App.tsx",
          "./src/components/PlatformNavigation.tsx",
          "./src/pages/Index.tsx",
        ],
      },
    },

    preview: {
      port: 4173,
      host: true,
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "lucide-react",
        "recharts",
        "@radix-ui/react-accordion",
        "@radix-ui/react-alert-dialog",
        "@radix-ui/react-tabs",
        "@supabase/supabase-js",
      ],
      exclude: ["@vite/client", "@vite/env", "@supabase/node-fetch"],
      force: false,
      esbuildOptions: {
        target: "es2020",
        keepNames: true,
        define: {
          global: "globalThis",
          "process.env": "{}",
        },
      },
    },

    esbuild: {
      logOverride: {
        "this-is-undefined-in-esm": "silent",
        "direct-eval": "silent",
      },
      target: "es2020",
      keepNames: true,
      treeShaking: true,
      platform: "browser",
      format: "esm",
    },

    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
  };
});
