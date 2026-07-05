# react-native-image-editor-skia

A Skia-powered image annotation & editing component for React Native. Import an
image from **base64 or a file/remote URI**, let the user annotate and transform
it, then export **full-resolution base64**.

Features:

- ✏️ Draw **circles, arrows, markers (highlight), freehand, and text**
- 🎨 Change **stroke color and text color**
- ✋ **Select / move / resize / rotate / delete** any annotation
- 🖼️ **Crop, resize, and free-angle rotate** the image (non-destructive)
- ↩️ **Undo / redo**
- 📤 Export to **base64** (PNG or JPEG), at the image's native resolution
- 🧠 Careful **Skia memory management** (explicit `dispose()` — no leaks from
  large base64 payloads)

> Built on [`@shopify/react-native-skia`](https://shopify.github.io/react-native-skia/).
> **Requires the React Native New Architecture** (Skia v2).

## Compatibility

**React Native New Architecture is required** (Skia v2 dropped the old
architecture). Supported RN range: **0.79 → 0.82+**. **Verified on RN 0.81.0.**

The exact Reanimated + Worklets versions depend on your RN version (Reanimated
enforces this at build time). Pick a matching row:

| React Native | react-native-reanimated | react-native-worklets |
| --- | --- | --- |
| 0.79 – 0.81 | 4.0.x | 0.4.x |
| 0.78 – 0.82 | 4.1.x | 0.5.x – 0.8.x |
| 0.80 – 0.84 | 4.2.x | 0.7.x – 0.8.x |
| **0.81 – 0.85** | **4.3.x** | **0.8.x** |
| 0.83 – 0.86 | 4.4.x – 4.5.x | 0.9.x – 0.10.x |

Other peers: `@shopify/react-native-skia` **>= 2.6.0**,
`react-native-gesture-handler` **>= 2.x**, `react`/`react-native` any (subject
to the New Architecture + table above).

### Current versions (this release)

| Package | Version |
| --- | --- |
| react-native-image-editor-skia | 0.1.0 |
| @shopify/react-native-skia | 2.6.9 |
| react-native-reanimated | 4.3.2 |
| react-native-worklets | 0.8.3 |
| react-native-gesture-handler | 2.32.0 |
| react / react-native (example) | 19.1.0 / 0.81.0 |

## Installation

```sh
npm install react-native-image-editor-skia
# peer dependencies:
npm install @shopify/react-native-skia react-native-gesture-handler \
  react-native-reanimated react-native-worklets
cd ios && pod install
```

Then:

1. Enable the **New Architecture** (required by Skia v2).
2. Add the Reanimated/Worklets Babel plugin **last** in `babel.config.js`:
   ```js
   module.exports = {
     presets: ['module:@react-native/babel-preset'],
     plugins: ['react-native-worklets/plugin'],
   };
   ```
3. The editor wraps itself in a `GestureHandlerRootView`, but if you compose it
   with other gesture-handler components, ensure your app root is wrapped too.

> Pin `@shopify/react-native-skia`, `react-native-reanimated`, and
> `react-native-worklets` to compatible versions — the matrix is strict.

## Usage

```tsx
import { useRef } from 'react';
import { ImageEditor, type ImageEditorRef } from 'react-native-image-editor-skia';

function Screen() {
  const ref = useRef<ImageEditorRef>(null);

  return (
    <ImageEditor
      ref={ref}
      source={{ uri: 'https://example.com/photo.jpg' }}
      // or: source={{ base64: 'data:image/png;base64,iVBORw0...' }}
      onExport={(base64) => {
        // `base64` is a data URI by default — usable directly in <Image>.
      }}
    />
  );
}
```

### Input: base64 **or** file/URI

```tsx
<ImageEditor source={{ base64: 'data:image/png;base64,iVBOR...' }} />
<ImageEditor source={{ uri: 'file:///storage/emulated/0/photo.jpg' }} />
<ImageEditor source={{ uri: 'https://example.com/photo.jpg' }} />
```

### Output: base64 (default)

```ts
const base64 = await ref.current?.export({
  format: 'jpeg',      // 'png' | 'jpeg'
  quality: 90,         // JPEG quality 0..100
  maxExportSize: 2000, // clamp the longest edge (guards against OOM)
  dataUri: true,       // false → raw base64 with no prefix
});
```

### Output: file location

React Native has no built-in filesystem, so you supply a one-line `writeFile`
from whatever fs module you use (react-native-fs, expo-file-system, …). The
library encodes the image and hands you the raw base64 to persist; `export()`
resolves to the written path.

```ts
import RNFS from 'react-native-fs';

const path = await ref.current?.export({
  output: 'file',
  filePath: `${RNFS.CachesDirectoryPath}/edited.png`,
  writeFile: (p, base64) => RNFS.writeFile(p, base64, 'base64'),
});
// path === `${RNFS.CachesDirectoryPath}/edited.png`
```

```ts
// expo-file-system variant
import * as FileSystem from 'expo-file-system';

await ref.current?.export({
  output: 'file',
  filePath: FileSystem.cacheDirectory + 'edited.jpg',
  format: 'jpeg',
  writeFile: (p, base64) =>
    FileSystem.writeAsStringAsync(p, base64, { encoding: 'base64' }),
});
```

Ref API: `export(options?)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`,
`reset()`.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `source` | `{ base64 } \| { uri }` | Image to edit (base64 raw/data-URI, or file/remote URI). |
| `onExport` | `(base64: string) => void` | Fired when the built-in **Done** button exports. |
| `exportOptions` | `ExportOptions` | Defaults for the Done button. |
| `initialStrokeColor` | `string` | Default shape color. |
| `initialTextColor` | `string` | Default text color. |
| `palette` | `string[]` | Colors shown in the picker. |
| `hideToolbar` | `boolean` | Hide the built-in toolbar and drive tools via `useEditor()`. |
| `onError` | `(error: Error) => void` | Called if the image fails to decode. |

## How it works

- **Coordinate space** — all annotations are stored in the base image's
  full-resolution pixel space. A single affine matrix maps to the on-screen
  canvas; gestures invert it. Export renders the exact same numbers off-screen at
  native resolution, so output is never the downscaled on-screen size.
- **Performance** — committed annotations live in React state; the in-flight
  gesture (drawing / moving / resizing / rotating) is driven by Reanimated shared
  values on the UI thread, so there are **zero React re-renders mid-gesture**.
- **Export** — uses `Skia.Surface.MakeOffscreen(...)`, draws the (optionally
  cropped) image + annotations with the scene rotation/scale, encodes to base64,
  and **disposes the surface + snapshot** immediately.

## Memory management

Skia `SkImage`/`SkData`/`SkSurface` are JSI HostObjects; Hermes' GC under-counts
their native footprint. This library:

- disposes the encoded `SkData` immediately after decoding an image,
- disposes the previous `SkImage` when `source` changes or on unmount,
- never stores the input base64 in React state or undo history,
- disposes the export surface + snapshot in a `finally` block,
- optionally clamps export size (`maxExportSize`) to avoid transient OOM on very
  large images.

## Caveats

- **New Architecture only** (Skia v2).
- Text uses a system font via `matchFont`; explicit `\n` newlines are honored,
  automatic width-wrapping is not (v1).
- If `Skia.Surface.MakeOffscreen` is unavailable on a given device/version,
  `export()` throws — fall back to snapshotting an off-screen `<Canvas>` with
  `makeImageSnapshotAsync`.

## License

MIT
