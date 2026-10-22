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
            if (req.url && req.url.startsWith('/api/')) {
              const urlParts = req.url.split('?');
              const routePath = urlParts[0].replace(/^\/api\//, '');
              const queryString = urlParts[1] || '';
              const query = Object.fromEntries(new URLSearchParams(queryString));
              let filePath = path.resolve(__dirname, `api/${routePath}.js`);
              if (!fs.existsSync(filePath)) {
                filePath = path.resolve(__dirname, `api/${routePath}/index.js`);
              }
              if (!fs.existsSync(filePath) && routePath === 'tracking-order') {
                filePath = path.resolve(__dirname, 'api/track.js');
              }
              if (fs.existsSync(filePath)) {
                const runHandler = async (parsedBody: any) => {
                  (req as any).body = parsedBody || {};
                  (req as any).query = query;
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
                };

                if (req.method === 'GET' || req.readableEnded) {
                  runHandler({});
                  return;
                }

                try {
                  let body = '';
                  req.on('data', chunk => { body += chunk; });
                  req.on('end', () => {
                    let parsed = {};
                    try {
                      if (body) parsed = JSON.parse(body);
                    } catch {
                      // ignore parse errors
                    }
                    runHandler(parsed);
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
