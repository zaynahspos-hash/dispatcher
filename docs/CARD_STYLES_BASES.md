# 🎨 Card Styles & Component Bases
Zaynahs Courier Manager · Design System & UI Specifications

---

## 1. Design Philosophy
All cards in Zaynahs Courier Manager follow modern SaaS logistics aesthetics inspired by Shopify Admin and high-end courier dashboards:
- Clean borders and distinct visual depth.
- High-contrast, mobile-first layouts without performance-degrading blur filters.
- Immediate readability of critical delivery signals (Tracking #, Customer Name, Phone, COD, Status).

---

## 2. Card Tokens & Anatomy

### 2.1 Base Card Container
| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `bg-white` | `bg-slate-900` / `bg-gray-900` |
| Border | `border border-gray-200` | `border border-gray-800` |
| Border Radius | `rounded-2xl` (16px) or `rounded-xl` (12px) | `rounded-2xl` or `rounded-xl` |
| Shadow | `shadow-sm hover:shadow-md` | `shadow-sm hover:shadow-gray-950/50` |
| Transition | `transition-all duration-200` | `transition-all duration-200` |

### 2.2 Padding Hierarchy
- **Mobile (< 640px)**: `p-3.5` or `p-4`
- **Tablet / Desktop (>= 640px)**: `p-5` or `p-6`

---

## 3. Parcel Logistics Card (Mobile View)
On mobile viewports (< 768px), table rows transform into rich, touch-optimized parcel cards:

```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
  {/* Card Header: Tracking + Status Pill */}
  <div className="flex items-center justify-between">
    <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
      {parcel.trackingNumber}
    </span>
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle}`}>
      {parcel.status}
    </span>
  </div>

  {/* Card Body: Customer & Destination */}
  <div>
    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
      {parcel.customerName}
    </h4>
    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
      <span>{parcel.cityName}</span> • <span>{parcel.customerPhone}</span>
    </p>
  </div>

  {/* Card Footer: COD Amount + Action Buttons */}
  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
    <span className="font-bold text-gray-800 dark:text-gray-200">
      Rs. {parcel.codAmount.toLocaleString()}
    </span>
    <div className="flex items-center gap-2">
      {/* 44px min touch target button */}
      <button className="min-h-[44px] min-w-[44px] p-2 text-blue-600 dark:text-blue-400 font-medium">
        Track
      </button>
    </div>
  </div>
</div>
```

---

## 4. Status Badge Tokens
Consistent color mapping across all tabs and components:

| Status | Background (Light) | Text (Light) | Background (Dark) | Text (Dark) |
|--------|-------------------|--------------|-------------------|-------------|
| **Booked / Unassigned** | `bg-blue-50` | `text-blue-700` | `bg-blue-950/60` | `text-blue-300` |
| **In-Transit / Out for Delivery** | `bg-amber-50` | `text-amber-700` | `bg-amber-950/60` | `text-amber-300` |
| **Delivered** | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-950/60` | `text-emerald-300` |
| **Returned / Returning** | `bg-rose-50` | `text-rose-700` | `bg-rose-950/60` | `text-rose-300` |
| **Cancelled** | `bg-gray-100` | `text-gray-700` | `bg-gray-800` | `text-gray-400` |

---

## 5. Metrics & Analytics Cards
- Large numerical display (`text-2xl font-bold font-mono`).
- Accompanying micro-icon with rounded background pill (`w-10 h-10 rounded-xl`).
- High-contrast subtitles (`text-xs text-gray-500 dark:text-gray-400`).

---

## 6. Performance & Rendering Guidelines (RULE M10b)
1. **Never use `backdrop-blur-*` on cards**. It causes heavy GPU tile re-rendering during list scrolling.
2. Use solid background colors with opacity (`bg-slate-900/95`, `bg-white/95`) when overlays are necessary.
3. Ensure every interactive button or clickable region on a card maintains at least a 44x44px touch target on mobile.
