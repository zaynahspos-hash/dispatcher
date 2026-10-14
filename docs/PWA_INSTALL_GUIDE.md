# 📱 Progressive Web App (PWA) Installation Guide
Zaynahs Courier Manager · Mobile & Handheld Scanner Setup

---

## 1. Overview
Zaynahs Courier Manager is designed as a high-performance Progressive Web App (PWA). It provides a native app experience on iOS, Android, and dedicated Android-based warehouse barcode scanner terminals without needing an app store download.

---

## 2. PWA Features & Manifest Configuration

### 2.1 Web App Manifest (`manifest.json`)
The manifest configures the standalone application presentation:
- **`display`**: `standalone` (removes browser URL bar and navigation buttons).
- **`start_url`**: `.` (loads the root application).
- **`theme_color`**: `#1e293b` (dark slate theme matching the app header).
- **`background_color`**: `#0f172a` (smooth launch screen).
- **Icons**:
  - `favicon-96x96.png`
  - `apple-touch-icon.png` (180x180)
  - `web-app-manifest-192x192.png`
  - `web-app-manifest-512x512.png`

---

## 3. Installation Instructions by Platform

### 3.1 Android Devices & Barcode Handheld Scanners (Chrome)
1. Open the application URL in Google Chrome.
2. An automated installation banner will prompt: **"Install Zaynahs Courier Manager"**.
3. Alternatively, tap the Chrome menu (⋮) in the top-right corner.
4. Select **"Install app"** or **"Add to Home screen"**.
5. Tap **Install**. The app will appear on the device home screen and launcher.

### 3.2 Apple iOS (iPhone & iPad Safari)
1. Open the application URL in **Safari** (iOS does not allow PWA installation from Chrome or Firefox).
2. Tap the **Share** button (box with an upward arrow) in the bottom navigation bar.
3. Scroll down the share sheet and select **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner.
5. The application icon will now launch in full-screen standalone mode without Safari UI frames.

---

## 4. In-App Install Prompt Component
The application features a built-in install helper modal (`showInstallGuide`):
- Listens to the `beforeinstallprompt` event in Chromium browsers.
- Stores the deferred prompt event in component state.
- Presents a one-tap **"Install App"** button that invokes `prompt()`.
- Provides step-by-step visual instructions if the user is on iOS Safari.

---

## 5. Offline Resilience & Sync
- User settings and recent cache are mirrored in browser `localStorage`.
- Once loaded, the single-file bundled app executes 100% client-side logic even if mobile cellular connectivity momentarily drops.
- Network requests to Supabase and PostEx queue gracefully and alert the user if internet connection is lost.
