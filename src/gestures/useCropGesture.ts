import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import type { Rect, Vec2 } from '../types';
import { useEditor } from '../context/EditorContext';
import { HANDLE_SIZE } from '../constants';
import { applyToPoint, distance, invert } from '../utils/math';

const MIN_CROP = 24; // minimum crop size, in image pixels

type CropMode = 'none' | 'move' | 'resize';

/**
 * Pan gesture that edits `cropRectSV` (image space) while the crop tool is
 * active. Grab a corner to resize, or the interior to move. All values stay
 * clamped inside the image bounds.
 */
export function useCropGesture() {
  const { tool, matrix, cropRectSV, imageSize } = useEditor();
  const invMatrix = useMemo(() => invert(matrix), [matrix]);

  const cropMode = useSharedValue<CropMode>('none');
  const corner = useSharedValue(-1);
  const startRect = useSharedValue<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const startImg = useSharedValue<Vec2>({ x: 0, y: 0 });

  return useMemo(() => {
    return Gesture.Pan()
      .enabled(tool === 'crop')
      .maxPointers(1)
      .onBegin((e) => {
        'worklet';
        const screen = { x: e.x, y: e.y };
        const img = applyToPoint(invMatrix, screen);
        const r = cropRectSV.value;
        startRect.value = r;
        startImg.value = img;

        const corners: Vec2[] = [
          { x: r.x, y: r.y },
          { x: r.x + r.width, y: r.y },
          { x: r.x + r.width, y: r.y + r.height },
          { x: r.x, y: r.y + r.height },
        ];
        for (let i = 0; i < corners.length; i++) {
          const cs = applyToPoint(matrix, corners[i]!);
          if (distance(screen, cs) <= HANDLE_SIZE * 1.5) {
            cropMode.value = 'resize';
            corner.value = i;
            return;
          }
        }
        if (
          img.x >= r.x &&
          img.x <= r.x + r.width &&
          img.y >= r.y &&
          img.y <= r.y + r.height
        ) {
          cropMode.value = 'move';
        } else {
          cropMode.value = 'none';
        }
      })
      .onChange((e) => {
        'worklet';
        const img = applyToPoint(invMatrix, { x: e.x, y: e.y });
        const dx = img.x - startImg.value.x;
        const dy = img.y - startImg.value.y;
        const s = startRect.value;

        if (cropMode.value === 'move') {
          let nx = s.x + dx;
          let ny = s.y + dy;
          nx = Math.max(0, Math.min(nx, imageSize.width - s.width));
          ny = Math.max(0, Math.min(ny, imageSize.height - s.height));
          cropRectSV.value = { x: nx, y: ny, width: s.width, height: s.height };
        } else if (cropMode.value === 'resize') {
          // Fixed corner = the one opposite the grabbed corner.
          const left = s.x;
          const top = s.y;
          const right = s.x + s.width;
          const bottom = s.y + s.height;
          let x0 = left;
          let y0 = top;
          let x1 = right;
          let y1 = bottom;
          switch (corner.value) {
            case 0: // TL moves
              x0 = Math.min(right - MIN_CROP, Math.max(0, left + dx));
              y0 = Math.min(bottom - MIN_CROP, Math.max(0, top + dy));
              break;
            case 1: // TR moves
              x1 = Math.max(left + MIN_CROP, Math.min(imageSize.width, right + dx));
              y0 = Math.min(bottom - MIN_CROP, Math.max(0, top + dy));
              break;
            case 2: // BR moves
              x1 = Math.max(left + MIN_CROP, Math.min(imageSize.width, right + dx));
              y1 = Math.max(top + MIN_CROP, Math.min(imageSize.height, bottom + dy));
              break;
            case 3: // BL moves
              x0 = Math.min(right - MIN_CROP, Math.max(0, left + dx));
              y1 = Math.max(top + MIN_CROP, Math.min(imageSize.height, bottom + dy));
              break;
            default:
              break;
          }
          cropRectSV.value = {
            x: x0,
            y: y0,
            width: x1 - x0,
            height: y1 - y0,
          };
        }
      })
      .onEnd(() => {
        'worklet';
        cropMode.value = 'none';
        corner.value = -1;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, matrix, imageSize]);
}
