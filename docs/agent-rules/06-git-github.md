# 06 — Git & GitHub Version Control Rules

Hygiene, commit standards, and branch policies for Zaynah's Courier Manager.

---

## 1. Commit Message Standards
- Use clear, descriptive commit messages adhering to conventional commit prefixes:
  - `feat: add PostEx V3 load sheet bulk download`
  - `fix: resolve return city fallback when postex_return is blank`
  - `refactor: wipe Prisma ORM and switch to pure Supabase JS client`
  - `docs: update RLS security policies and master schema`
  - `perf: eliminate backdrop-blur to boost mobile scroll framerate`

---

## 2. Never Commit Secrets (STRICT)
- Never commit `.env`, `.env.local`, or any file containing live PostEx merchant tokens, Groq API keys, or Supabase service keys.
- Always verify `.gitignore` contains:
  ```gitignore
  .env
  .env.local
  .env.*.local
  node_modules/
  dist/
  ```

---

## 3. Pre-Commit Verification Checklist
Before staging and committing changes:
1. `npm run build` must complete with 0 errors.
2. `supabase/schema/SUPER_MASTER_SCHEMA.sql` must reflect any database changes.
3. No lingering `console.log` statements with sensitive tokens or raw customer PII.

---

## 4. Git Push & Deployment Policy — Zero Auto-Push, Never Deploy Without Explicit Command (RULE G4)
- **NEVER execute `git push` or deploy code autonomously under any circumstance.**
- Remote code pushes (`git push`, `git push origin main`) and live deployments are **STRICTLY FORBIDDEN** unless the user explicitly commands it in that exact prompt (e.g., "push karo", "deploy kar do").
- **Do Not Push After Task Completion — Say 'All done'**: When any bug fix, feature, or verification is completed and `npm run build` passes with 0 errors, DO NOT push. Instead, strictly respond with **"All done!"** (or "All donee") alongside a brief, clear summary of what was accomplished and wait for the user's explicit command before any remote push or deploy.
- **Check All Pending Tasks First**: Before any push, verify all pending requests, questions, UI fixes, and user queue items to ensure nothing is left unaddressed.
