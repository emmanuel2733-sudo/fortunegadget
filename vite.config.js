import { defineConfig, loadEnv, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "REACT_APP_", "PORT"]);
  const port = Number(env.PORT) || 3001;

  return {
    plugins: [
      {
        name: "treat-js-files-as-jsx",
        async transform(code, id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("/src/") || !normalizedId.endsWith(".js")) {
            return null;
          }

          return transformWithEsbuild(code, id, {
            loader: "jsx",
            jsx: "automatic",
          });
        },
      },
      react(),
    ],
    envPrefix: ["VITE_", "REACT_APP_"],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
    server: {
      host: "0.0.0.0",
      port,
      strictPort: true,
    },
    preview: {
      host: "0.0.0.0",
      port,
      strictPort: true,
    },
    build: {
      outDir: "build",
    },
  };
});
