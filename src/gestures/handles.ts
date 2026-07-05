import type { Annotation, Vec2 } from '../types';
import { annotationBounds, annotationCenter } from '../annotations/geometryPure';
import { ROTATE_HANDLE_OFFSET } from '../constants';
import { applyToPoint, rotatePoint } from '../utils/math';
import type { Mat } from '../utils/math';

export interface SelectionHandles {
  /** Corner handles in SCREEN space: top-left, top-right, bottom-right, bottom-left. */
  corners: [Vec2, Vec2, Vec2, Vec2];
  /** Rotate handle in screen space (above the top edge). */
  rotate: Vec2;
  /** Annotation center in screen space. */
  center: Vec2;
}

/**
 * Compute selection-box handle positions in SCREEN space for annotation `a`,
 * accounting for its rotation and the current image→screen matrix. Worklet-safe
 * (used by the transform gesture) and also callable from JS (SelectionOverlay).
 */
export function selectionHandles(a: Annotation, matrix: Mat): SelectionHandles {
  'worklet';
  const b = annotationBounds(a);
  const center = annotationCenter(a);
  const localCorners: Vec2[] = [
    { x: b.x, y: b.y },
    { x: b.x + b.width, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x, y: b.y + b.height },
  ];
  const screenCorners = localCorners.map((c) =>
    applyToPoint(matrix, rotatePoint(c, center, a.rotation))
  ) as [Vec2, Vec2, Vec2, Vec2];

  const centerScreen = applyToPoint(matrix, center);
  const topMid = {
    x: (screenCorners[0].x + screenCorners[1].x) / 2,
    y: (screenCorners[0].y + screenCorners[1].y) / 2,
  };
  // Push the rotate handle outward from center along the top-edge direction.
  const dx = topMid.x - centerScreen.x;
  const dy = topMid.y - centerScreen.y;
  const len = Math.hypot(dx, dy) || 1;
  const rotate = {
    x: topMid.x + (dx / len) * ROTATE_HANDLE_OFFSET,
    y: topMid.y + (dy / len) * ROTATE_HANDLE_OFFSET,
  };

  return { corners: screenCorners, rotate, center: centerScreen };
}
