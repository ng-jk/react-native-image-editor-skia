import { useEffect } from 'react';
import { Circle, Group, Path, Rect, Skia } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { EditorContextValue } from '../context/EditorContext';
import { HANDLE_SIZE } from '../constants';
import { applyToPoint } from '../utils/math';
import type { Vec2 } from '../types';

/**
 * Crop UI drawn in screen space: a dimmed full-screen scrim plus the crop
 * rectangle's border and corner handles, which follow `cropRectSV` on the UI
 * thread (works even when the scene is rotated, since the border is a quad).
 */
export function CropOverlay({ editor }: { editor: EditorContextValue }) {
  const { tool, doc, cropRectSV, matrixSV, imageSize, layout } = editor;

  // When entering the crop tool, seed the crop rect from the current scene.
  useEffect(() => {
    if (tool === 'crop') {
      cropRectSV.value =
        doc.scene.cropRect ?? {
          x: 0,
          y: 0,
          width: imageSize.width,
          height: imageSize.height,
        };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  const cropPath = useDerivedValue(() => {
    const r = cropRectSV.value;
    const m = matrixSV.value;
    const p = Skia.Path.Make();
    const c0 = applyToPoint(m, { x: r.x, y: r.y });
    const c1 = applyToPoint(m, { x: r.x + r.width, y: r.y });
    const c2 = applyToPoint(m, { x: r.x + r.width, y: r.y + r.height });
    const c3 = applyToPoint(m, { x: r.x, y: r.y + r.height });
    p.moveTo(c0.x, c0.y);
    p.lineTo(c1.x, c1.y);
    p.lineTo(c2.x, c2.y);
    p.lineTo(c3.x, c3.y);
    p.close();
    return p;
  });

  const corners = useDerivedValue<Vec2[]>(() => {
    const r = cropRectSV.value;
    const m = matrixSV.value;
    return [
      applyToPoint(m, { x: r.x, y: r.y }),
      applyToPoint(m, { x: r.x + r.width, y: r.y }),
      applyToPoint(m, { x: r.x + r.width, y: r.y + r.height }),
      applyToPoint(m, { x: r.x, y: r.y + r.height }),
    ];
  });

  // Per-corner x/y derived values (declared unconditionally — rules of hooks).
  const c0x = useDerivedValue(() => corners.value[0]!.x);
  const c0y = useDerivedValue(() => corners.value[0]!.y);
  const c1x = useDerivedValue(() => corners.value[1]!.x);
  const c1y = useDerivedValue(() => corners.value[1]!.y);
  const c2x = useDerivedValue(() => corners.value[2]!.x);
  const c2y = useDerivedValue(() => corners.value[2]!.y);
  const c3x = useDerivedValue(() => corners.value[3]!.x);
  const c3y = useDerivedValue(() => corners.value[3]!.y);

  if (tool !== 'crop') {
    return null;
  }

  const r = HANDLE_SIZE / 2;
  return (
    <Group>
      {/* Dimmed scrim over the whole canvas. */}
      <Rect
        x={0}
        y={0}
        width={layout.width}
        height={layout.height}
        color="rgba(0,0,0,0.45)"
      />
      {/* Crop rectangle border. */}
      <Path path={cropPath} color="#FFFFFF" style="stroke" strokeWidth={2} />
      <Circle cx={c0x} cy={c0y} r={r} color="#FFFFFF" />
      <Circle cx={c1x} cy={c1y} r={r} color="#FFFFFF" />
      <Circle cx={c2x} cy={c2y} r={r} color="#FFFFFF" />
      <Circle cx={c3x} cy={c3y} r={r} color="#FFFFFF" />
    </Group>
  );
}
