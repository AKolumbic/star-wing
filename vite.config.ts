import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: !isProd,
      minify: isProd,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              pure_funcs: [
                "console.log",
                "console.info",
                "console.debug",
                "console.warn",
              ],
            },
          }
        : undefined,
    },
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
  };
});
