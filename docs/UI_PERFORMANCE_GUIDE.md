# ⚡ UI Performance Guide & Mobile Latency Elimination

Engineering protocols for 60fps mobile framerates, 0ms tab navigation, and GPU efficiency.

---

## 1. Zero Backdrop-Blur Rule (RULE M10b)
- **Problem**: When `backdrop-blur-md` is placed on sticky elements or scrolling lists, mobile WebKit / Blink repaints the entire screen bitmap on every single scroll tick.
- **Solution**: Complete ban on `backdrop-blur-*`. Always use solid or high-opacity layers:
  ```tsx
  // ✅ High performance
  <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800">
  ```

---

## 2. Scroll Snap-Back & Bounce Prevention (RULE M7)
- Primary scrolling containers must specify `overscroll-behavior-y: none` (`overscroll-y-none`) to prevent the elastic rubber-band bounce from hijacking scrolling inertia.
- Modal inner scroll containers must declare `overscroll-contain touch-pan-y`.

---

## 3. 0ms Instant Navigation Standard (RULE F1)
- Tab transitions between Paste, Review, Booked History, Settings, and Admin must execute in 0ms.
- Use optimistic memory caches (`cacheWithExpiry.ts`) for tracking statuses so switching tabs never triggers empty white flashes or layout jumps.
