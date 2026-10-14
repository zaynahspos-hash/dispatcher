# 13 — Autonomous Boundaries & Decision Protocols

Defines what the agent can execute autonomously versus what requires user approval.

---

## 1. Auto-Allowed Actions (Agent Decides & Executes)
The agent should proceed directly without asking for confirmation when:
- Creating or fixing React components, utility functions, or custom hooks.
- Refactoring and cleaning up messy code, enforcing DRY principles.
- Adding missing TypeScript types, fixing build errors, or running `npm run build`.
- Adding new non-destructive columns or triggers to `SUPER_MASTER_SCHEMA.sql`.
- Updating documentation, guides, or rule files.
- Updating CSS styles, improving responsiveness, or adhering to design tokens.

---

## 2. Confirm-First Actions (Agent Asks Before Proceeding)
The agent MUST pause and confirm with the user before:
- Running destructive database SQL queries (`DROP TABLE`, `TRUNCATE`, deleting user production history).
- Removing existing merchant settings keys or altering production credentials.
- Rewriting core architecture from scratch when not explicitly requested.
