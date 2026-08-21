import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = env.DEV_API_PROXY_TARGET?.replace(/\/$/, "") ?? ""

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: env.DEV_SERVER_HOST || "127.0.0.1",
      port: Number(env.DEV_SERVER_PORT || 5173),
      strictPort: true,
      proxy:
        command === "serve" && proxyTarget
          ? {
              "/api-backend": {
                target: proxyTarget,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api-backend/, ""),
              },
            }
          : undefined,
    },
  }
})
