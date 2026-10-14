# 19 — Navigation & State Restoration Rules

Persistent tab state, scroll restoration, and session preservation.

---

## 1. Tab Persistence
- When a user refreshes the page or navigates away, the active tab (`paste`, `review`, `history`, `settings`, `admin`) should be preserved either via URL hash/query or `sessionStorage`.
- When switching between tabs, in-progress edits in `ParcelTable` or raw input text in `PasteInput` must NEVER be discarded unintentionally.

---

## 2. Scroll Position Restoration
- In `BookedHistory`, when opening a Shipper Advice modal or tracking detail drawer and closing it, the user must return to the exact scroll position in the history list.
- Prevent scroll snapping or resetting to top on re-renders.
