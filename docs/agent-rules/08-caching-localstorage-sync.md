# 08 — Caching, LocalStorage & Supabase Cloud Sync

Data persistence, offline-first reliability, and strict cache invalidation policies.

---

## RULE C10 — ZERO STALE DATA SHOWING (STRICT & PERMANENT)
> **Old/stale data being shown to the user after a write operation is NEVER allowed under any circumstance.**

This is a critical quality invariant. Violations destroy merchant trust.

### Rules:
1. **After every write (booking, settings save, customer update, advice save)**:
   - Immediately update **local React state** (optimistic update).
   - Immediately update **`localStorage`** cache.
   - Then dispatch the **Supabase** write asynchronously.
   - On write **success**: do nothing extra — UI is already up-to-date.
   - On write **failure**: roll back local state AND localStorage to the previous snapshot and show an error toast.
2. **Cache-then-refresh pattern**: When the app loads, display cached data instantly (0ms), then silently fetch latest from Supabase in the background and replace on success.
3. **Write invalidates cache**: Any write to `booked_history`, `user_settings`, or `customers` must clear/update the relevant localStorage entry at the same moment — never leave a stale key behind.
4. **Never show cached data after navigating to a fresh session or after logout/login.** On auth state change, clear ALL tenant-scoped local cache entries.

### Anti-Patterns (BANNED):
```typescript
// ❌ Writing to Supabase but showing old data until page refresh
await supabase.from('booked_history').upsert(...)
// ... NOT updating local state — old list still renders! BANNED.

// ❌ Fetching on mount but no optimistic state update on save
// ... user waits 2+ seconds to see their new booking appear. BANNED.

// ✅ Correct: optimistic update first, then async write
setParcels(prev => [newParcel, ...prev])                    // 1. UI instant
localStorage.setItem('booked_history', JSON.stringify(...)) // 2. Cache instant
await supabase.from('booked_history').upsert(...)           // 3. DB async
```

---

## 1. Local-First Architecture
Because parcel booking happens rapidly in warehouse environments with occasional connectivity fluctuations, Zaynah's Courier Manager implements an offline-first resilient sync model:
- Active settings and booked history are cached locally in browser `localStorage`.
- When an authenticated user signs in, local data is displayed instantly, then silently merged with Supabase cloud records.

---

## 2. Cache TTL Rules (`src/utils/cacheWithExpiry.ts`)
- **Live Tracking Status**: 10–15 min TTL — avoids hammering PostEx tracking APIs on every re-render but stays fresh enough for operational use.
- **City List** (`cityList.ts`): 7 days TTL — completely static operational data.
- **User Settings**: No TTL — always fetch fresh on mount. Never serve stale PostEx tokens from old cache.
- **Booked History**: No TTL — always sync with Supabase on mount; update optimistically on write.

---

## 3. Optimistic Update & Sync Workflow
1. When a parcel is booked via PostEx:
   - Immediately prepend the new booked record to local state → user sees it instantly.
   - Update `localStorage` cache atomically in the same synchronous tick.
   - Dispatch async Supabase upsert to `booked_history`.
   - Log the event to `usage_logs` (`action: 'order_booked'`).
2. If Supabase write fails: roll back optimistic state and display a clear retry toast.

---

## 4. Cache Invalidation on Logout / Session Change
```typescript
// On auth sign-out or session expiry — purge ALL tenant-scoped cache
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('booked_history')
    localStorage.removeItem('user_settings')
    localStorage.removeItem('customers')
    // Clear all cacheWithExpiry keys for this tenant
  }
})
```

---

## 5. Multi-Device Sync & Database Protection (RULE C11)
- **Zero Excessive DB Reads (Rate-Limit & Crash Defense)**:
  - Do not query Supabase on client-side pagination clicks or tab switching. Pagination must slice local cache in memory.
  - This guarantees the database cannot be overwhelmed or rate-limited by rapid merchant clicks or bots.
- **Lightweight Multi-Device Sync on Window Focus**:
  - When the browser tab regains focus, query only the single scalar `updated_at` column from `booked_history`.
  - Only when `dbUpdated > lastSync` does the client fetch the newer full dataset in the background and update the cache.
- **Zero Stale / Zero Missing Data**:
  - Any local action (booking, cancelling, advice, deletion) instantly writes to local state and updates local timestamp, so fresh data is visible in 0ms while multi-device changes are automatically pulled.

---

## 6. Avatar & Image Resilient Caching & Anti-Auto-Deletion (RULE C12)
- **Zero Accidental Avatar Wiping**:
  - `avatar_url` is a protected persistent secret key (`CRITICAL_SECRET_KEYS`).
  - An empty DB fetch or periodic background sync must NEVER overwrite an existing cached avatar.
  - Manual settings saves (e.g. from Settings tab) must preserve current `avatar_url` so saving courier/AI settings cannot wipe profile images.
- **0ms Instant Cache-First Rendering**:
  - User avatars are cached locally in Base64 format via `src/utils/avatarCache.ts` (`zaynah_avatar_cache_${userId}`).
  - Avatars render in 0ms without network latency or initials flicker.
- **Dynamic Invalidation on Change**:
  - When the user uploads a new photo, the cache entry is immediately updated with the new photo and new cache timestamp.
  - When the user explicitly clicks "Remove", `clearCachedAvatar` immediately purges the cache and resets to initials.
  - Stale cached photos are never served after a photo update.
- **Dual Cloud & Metadata Sync**:
  - On upload, `avatar_url` is persisted to both `user_settings.settings.avatar_url` and Supabase Auth metadata (`supabase.auth.updateUser({ data: { avatar_url } })`) to ensure multi-device continuity.

---

## 7. Dual-Source Conflict-Free Caching & Tracking Sync (RULE C13)
- **CN Primary Anchor**: The PostEx Consignment Note (`tracking_number`) is the single immutable anchor for all cached parcels.
- **Timestamp Versioning**: Updates are only applied if `incoming.updated_at >= cached.updated_at`. Stale responses are silently rejected.
- **Atomic In-Memory Merge**: When syncing external orders (PostEx Portal, Shopify, WooCommerce, Custom Store APIs, Bulk Excel), local metadata (custom internal notes, order items, packaging state) must be preserved and merged atomically.
- **Zero Cloudflare Policy**: Cloudflare edge caching is permanently forbidden for dynamic authenticated SaaS routes to guarantee 0ms real-time sync without stale cache discrepancies or 524 timeouts.



