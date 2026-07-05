import type { Annotation, Vec2 } from '../types';
import { annotationBounds, annotationCenter } from '../annotations/geometryPure';
import { distanceToSegment, rotatePoint } from '../utils/math';

// NOTE: `hitOne` is declared BEFORE `hitTest`. The worklets Babel plugin rewrites
// `'worklet'` function declarations into `const`s (no hoisting), so a worklet that
// calls another must be defined after its callee.
function hitOne(a: Annotation, p: Vec2, slop: number): boolean {
  'worklet';
  switch (a.type) {
    case 'circle': {
      const d = Math.hypot(p.x - a.center.x, p.y - a.center.y);
      if (a.fill !== undefined) {
        return d <= a.radius + slop;
      }
      // Outline: hit near the ring.
      return Math.abs(d - a.radius) <= slop + a.strokeWidth / 2;
    }
    case 'arrow':
      return distanceToSegment(p, a.start, a.end) <= slop + a.strokeWidth / 2;
    case 'marker': {
      const r = a.rect;
      return (
        p.x >= r.x - slop &&
        p.x <= r.x + r.width + slop &&
        p.y >= r.y - slop &&
        p.y <= r.y + r.height + slop
      );
    }
    case 'freehand': {
      const pts = a.points;
      const tol = slop + a.strokeWidth / 2;
      for (let i = 1; i < pts.length; i++) {
        if (distanceToSegment(p, pts[i - 1]!, pts[i]!) <= tol) {
          return true;
        }
      }
      return pts.length === 1
        ? Math.hypot(p.x - pts[0]!.x, p.y - pts[0]!.y) <= tol
        : false;
    }
    case 'text': {
      const b = annotationBounds(a);
      return (
        p.x >= b.x - slop &&
        p.x <= b.x + b.width + slop &&
        p.y >= b.y - slop &&
        p.y <= b.y + b.height + slop
      );
    }
  }
}

/**
 * Return the id of the top-most annotation hit by `point` (image space), or null.
 * Worklet-safe so selection resolves on the UI thread during a tap.
 *
 * `slop` is an extra hit margin, in image pixels (screen slop / current scale).
 */
export function hitTest(
  annotations: Annotation[],
  point: Vec2,
  slop: number
): string | null {
  'worklet';
  // Iterate from top (highest z) to bottom.
  const ordered = [...annotations].sort((a, b) => b.z - a.z);
  for (let i = 0; i < ordered.length; i++) {
    const a = ordered[i]!;
    // Transform the touch into the annotation's local (unrotated) frame.
    const local = a.rotation
      ? rotatePoint(point, annotationCenter(a), -a.rotation)
      : point;
    if (hitOne(a, local, slop)) {
      return a.id;
    }
  }
  return null;
}
