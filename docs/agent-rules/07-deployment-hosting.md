# 07 — Deployment & Hosting Rules (Vite SPA, Vercel, Netlify)

Deployment standards and production build configurations. Zero Cloudflare requirements.

---

## 1. Single-File Bundling & SPA Delivery
- The project is equipped with `vite-plugin-singlefile`.
- When building for static distribution or offline PWA packaging, all JS, CSS, and SVG assets are inlined into a self-contained `dist/index.html`.
- This ensures maximum portability: the manager can be hosted on Vercel, Netlify, standard Nginx web servers, or opened directly from local disk in secure warehouse environments.

---

## 2. Environment Variables Configuration
The following environment variables are supported in `.env.local` and host settings:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Admin Role Configuration
VITE_ADMIN_EMAIL=admin@zaynahs.pk

# Default Operational Fallbacks (Optional)
VITE_GROQ_API_KEY=gsk_...
VITE_POSTEX_TOKEN=...
```

---

## 3. Host Deployment Commands
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x or 20.x+
- **Caching**: Zero Edge / CDN cache purge needed. All application requests are client-side dynamic.
