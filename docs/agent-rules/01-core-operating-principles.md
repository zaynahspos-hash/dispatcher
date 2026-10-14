# 01 — Core Operating Principles

- **Root cause first**: Pehle problem aur root-cause samjho, phir fix karo — guess-based patch lagana mana hai.
- **Impact check**: Har change se pehle check karo: "Kya PostEx booking, Groq AI parsing, ya Supabase RLS break ho sakta hai?"
- **Convention discipline**: Existing project structure, TypeScript interfaces, aur naming conventions follow karo.
- **Scope discipline**: Sirf jo manga gaya hai wahi build ya fix karo. Unrelated refactoring mana hai.
- **Decision logging**: Har major decision ka short summary record karo (kya fix kiya, kyun kiya).

---

## RULE OP1 — No Band-Aids, Permanent Global Fix Only (STRICT)
- **No temporary patches, no "it works on my machine".** Har issue ka root cause trace karo:
  `UI Component → Custom Hook → API Client / Helper → Supabase / PostEx / Groq → Error Handling → UI Feedback`
- Fix hamesha global aur reproducible hona chahiye. Agar phone formatting ya city lookup ka bug do jagah aa raha hai, to ek shared utility (`src/utils/`) fix karo, do alag inline patches nahi.
- Symptom chupana mana hai — empty `catch {}` blocks jo real error nigal jayein strictly BANNED hain. Real error ko UI toast aur console logs mein surface karo.
- Agar ek approach do baar fail ho jaye → incremental tweaking band karo, network payload aur API logs check karo, aur fundamentally robust solution apply karo.

---

## RULE OP2 — Zero Credential & Data Leakage (STRICT)
- **API Token Security**: PostEx Merchant Tokens, Groq API Keys, aur Supabase Service Role Keys kabhi bhi public repository, logs, ya unauthorized users ko leak na hon.
- **Multi-Tenant Isolation**: Ek user ka data (BookedHistory, UserSettings, Customers, UsageLogs) kisi doosre user ko visible na ho. Row Level Security (RLS) enforce hona lazmi hai.
- **Error Sanitization**: PostEx ke internal auth tokens ya Supabase connection strings ko error alert mein direct display mat karo — structured, safe merchant message do.

---

## RULE OP3 — Verify Before "Done" (STRICT)
- Kisi task ko "done" tabhi declare karo jab:
  1. `npm run build` bina kisi error ke pass ho (`tsc` zero errors).
  2. PostEx API request body schema V3 ke mutabiq valid ho.
  3. Groq AI prompt extraction edge cases (urdu mix, missing phone, city spelling) handle karti ho.
  4. Supabase RLS policies ke saath user-data correctly save aur fetch hota ho.

---

## RULE OP4 — Always Keep Master Docs in Sync (RULE SYNC2)
Jab bhi koi change karo, usi task ke andar docs update hone chahiye:
- Database table / column change → `supabase/schema/SUPER_MASTER_SCHEMA.sql` + `docs/SCHEMA_CHANGE_LOG.md`
- PostEx API change → `docs/POSTEX_INTEGRATION_GUIDE.md` + `README.md`
- Groq AI change → `docs/GROQ_AI_SYSTEM_GUIDE.md`
- UI / Design change → `docs/UI_RULES.md` + `docs/agent-rules/14-design-system.md`
- Bug fix → `docs/LESSONS_LEARNED.md`
