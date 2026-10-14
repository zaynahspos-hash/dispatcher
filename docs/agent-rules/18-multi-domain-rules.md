# 18 — Multi-Store & Warehouse Pickup Mapping Rules

Rules for multi-account, multi-warehouse, and multi-domain configurations.

---

## 1. Dynamic Pickup & Return Warehouse Mapping
- Many merchants operate multiple pickup locations or branches (e.g. Lahore Central Warehouse vs Karachi Distribution Point).
- The application stores warehouse identifiers dynamically inside `UserSettings.settings`:
  - `postex_pickup`: Operational pickup address code assigned by PostEx.
  - `postex_return`: Return address code. If blank, automatically falls back to `postex_pickup`.
- Never hardcode warehouse IDs in `.ts` or `.tsx` source code.

---

## 2. Dynamic Domain Resolution
- Use `window.location.origin` for auth callbacks, deep links, and redirects.
- Never hardcode `http://localhost:5173` or specific live domains in production redirects.
