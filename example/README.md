# Example app — test harness for `react-native-image-editor-skia`

A runnable bare React Native 0.81 app (New Architecture on) that consumes the
library **directly from `../src`**, so you can edit the library and see changes
with Fast Refresh — no build/publish step.

How it's wired:
- [babel.config.js](babel.config.js) aliases the package name → `../src` and adds
  the `react-native-worklets/plugin` (last).
- [metro.config.js](metro.config.js) watches `../src` and forces React / Skia /
  Reanimated / Gesture Handler / Worklets to resolve to a **single** copy (this
  app's `node_modules`).
- [App.tsx](App.tsx) is the demo screen (loads an image, edit, export, preview).

## Prerequisites

- Node ≥ 20, JDK 17, Android SDK (all detected on this machine).
- An Android device or emulator. For a physical device over Wi‑Fi, connect it
  first (see **Run on a Wi‑Fi device** below).

> This app has native modules (Skia etc.), so it must be **built** — it cannot
> run in a prebuilt Expo Go client.

## Install

Dependencies are already installed. If you ever need to redo it:

```sh
cd example
npm install --legacy-peer-deps
```

## Run on a Wi‑Fi device

1. Connect the device with adb over Wi‑Fi (Android 11+):
   ```sh
   adb pair 192.168.x.x:PORT       # from Settings → Developer options → Wireless debugging → Pair
   adb connect 192.168.x.x:5555    # the IP:port on the Wireless debugging screen
   adb devices                     # confirm it shows "device"
   ```
   (Older devices: `adb tcpip 5555` once over USB, then `adb connect <ip>:5555`.)

2. Start Metro (keep this terminal open):
   ```sh
   cd example
   npm start
   ```

3. In a second terminal, build & install the app:
   ```sh
   cd example
   npm run android
   ```

4. Let the app reach Metro over Wi‑Fi:
   ```sh
   adb reverse tcp:8081 tcp:8081
   ```
   If `adb reverse` isn't available on a pure-Wi‑Fi link, shake the device →
   **Dev Settings → Debug server host** → enter `YOUR_PC_IP:8081`, then reload.

## What to test

- Tap a tool (◯ circle, ↗ arrow, ▬ marker, ✎ freehand, **T** text) and draw.
- Pick a color from the swatch strip; recolor a selected shape.
- Tap **⇱ select**, then drag a shape to move; drag a corner to resize; drag the
  top handle to rotate; **🗑** to delete.
- **⛶ crop** → drag the crop box / corners → **✓ Apply**. Use the **Rotate** bar
  (drag left/right) for free‑angle rotation; **−/+** to resize.
- **↶ / ↷** undo / redo.
- **Done** exports and shows the result; or tap **Export via ref** for JPEG.
- Watch memory in Android Studio's profiler while repeatedly editing/exporting —
  it should return to baseline (no leak).

## iOS

```sh
cd example/ios && pod install && cd ..
npm run ios
```

## Troubleshooting

- **Unresolved module / duplicate React**: `npm start -- --reset-cache`.
- **Blank screen after Metro connects**: confirm `adb reverse tcp:8081 tcp:8081`
  or the Debug server host is set to your PC's LAN IP.
- **Skia/offscreen export throws**: verify New Architecture is enabled (RN 0.81
  default) — Skia v2 requires it.
