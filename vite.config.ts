import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      {
        name: 'api-auth-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/auth/')) {
              const routeName = req.url.split('?')[0].replace('/api/auth/', '');
              const filePath = path.resolve(__dirname, `api/auth/${routeName}.js`);
              if (fs.existsSync(filePath)) {
                try {
                  let body = '';
                  req.on('data', chunk => { body += chunk; });
                  req.on('end', async () => {
                    try {
                      if (body) (req as any).body = JSON.parse(body);
                    } catch {
                      // ignore parse errors
                    }
                    (res as any).status = (code: number) => {
                      res.statusCode = code;
                      return res;
                    };
                    (res as any).json = (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return res;
                    };
                    try {
                      const mod = await import(`file://${filePath}?t=${Date.now()}`);
                      const handler = mod.default || mod;
                      await handler(req, res);
                    } catch (handlerErr: any) {
                      console.error('[API Dev Handler Error]', handlerErr);
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ error: handlerErr.message || 'Server error' }));
                    }
                  });
                  return;
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                  return;
                }
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      proxy: {
        '/postex-api': {
          target: 'https://api.postex.pk',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/postex-api/, ''),
        },
        '/postex-public': {
          target: 'https://postex.pk',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/postex-public/, ''),
        }
      }
    }
  };
});
