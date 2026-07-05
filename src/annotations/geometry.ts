import { Skia } from '@shopify/react-native-skia';
import type { SkPath } from '@shopify/react-native-skia';

import type { Vec2 } from '../types';

// Re-export the pure helpers so existing imports from './geometry' keep working.
// (Worklet/test-safe versions with no Skia dependency live in ./geometryPure.)
export { annotationCenter, annotationBounds } from './geometryPure';

/**
 * Build a Skia path for an arrow (shaft + two arrowhead barbs).
 * Not a worklet — it allocates an `SkPath` (a Skia object) on the JS thread.
 */
export function buildArrowPath(
  start: Vec2,
  end: Vec2,
  headSize: number
): SkPath {
  const path = Skia.Path.Make();
  path.moveTo(start.x, start.y);
  path.lineTo(end.x, end.y);

  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const barb = (Math.PI * 5) / 6; // 150° from the shaft direction
  const b1 = {
    x: end.x + headSize * Math.cos(angle + barb),
    y: end.y + headSize * Math.sin(angle + barb),
  };
  const b2 = {
    x: end.x + headSize * Math.cos(angle - barb),
    y: end.y + headSize * Math.sin(angle - barb),
  };
  path.moveTo(end.x, end.y);
  path.lineTo(b1.x, b1.y);
  path.moveTo(end.x, end.y);
  path.lineTo(b2.x, b2.y);
  return path;
}

/** Build a smoothed (quadratic) path through freehand points. */
export function buildFreehandPath(points: Vec2[]): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) {
    return path;
  }
  path.moveTo(points[0]!.x, points[0]!.y);
  if (points.length === 1) {
    // Draw a dot.
    path.lineTo(points[0]!.x + 0.01, points[0]!.y + 0.01);
    return path;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const next = points[i + 1]!;
    const midX = (p.x + next.x) / 2;
    const midY = (p.y + next.y) / 2;
    path.quadTo(p.x, p.y, midX, midY);
  }
  const last = points[points.length - 1]!;
  path.lineTo(last.x, last.y);
  return path;
}
