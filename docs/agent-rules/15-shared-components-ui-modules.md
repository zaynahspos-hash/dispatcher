# 15 — Shared Components & UI Modules (Single Source of Truth)

Catalog of mandatory reusable components. Never hand-roll duplicate implementations.

---

## Canonical UI Modules Map

1. **`SearchableDropdown.tsx`**
   - **Path**: `src/components/SearchableDropdown.tsx`
   - **Use Case**: Searchable selection of Pakistani cities in ParcelTable, edit modals, and settings.
   - **Rule**: Never replace with a standard uncontrolled `<select>` when selecting cities.

2. **`Icons.tsx`**
   - **Path**: `src/components/Icons.tsx`
   - **Use Case**: All SVG icons across the app.
   - **Rule**: Centralized icon registry. Never write inline raw `<svg>` blocks in page components.

3. **`AuthModal.tsx` & `AuthPage.tsx`**
   - **Path**: `src/components/AuthModal.tsx`, `src/components/AuthPage.tsx`
   - **Use Case**: User authentication, signup, password reset with Supabase GoTrue Auth.
   - **Rule**: Single entry point for auth session management.

4. **`BookedHistory.tsx`**
   - **Path**: `src/components/BookedHistory.tsx`
   - **Use Case**: PostEx live tracking, status polling, shipper advice triggering, and loadsheet selection.

5. **`ParcelTable.tsx`**
   - **Path**: `src/components/ParcelTable.tsx`
   - **Use Case**: Editable grid of parsed parcels awaiting PostEx booking.

6. **`SettingsPage.tsx`**
   - **Path**: `src/components/SettingsPage.tsx`
   - **Use Case**: Merchant settings (Groq Key, PostEx Token, Pickup/Return Address codes, Store details).
