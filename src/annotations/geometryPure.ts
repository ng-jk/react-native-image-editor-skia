/**
 * Pure annotation geometry (no Skia imports) so it is safe to use from worklets
 * AND from plain unit tests without loading the native Skia module.
 */
import type { Annotation, Rect, Vec2 } from '../types';
import { boundsOfPoints } from '../utils/math';

/** Center of an annotation in image space (used as rotation/scale origin). */
export function annotationCenter(a: Annotation): Vec2 {
  'worklet';
  switch (a.type) {
    case 'circle':
      return { x: a.center.x, y: a.center.y };
    case 'arrow':
      return { x: (a.start.x + a.end.x) / 2, y: (a.start.y + a.end.y) / 2 };
    case 'marker':
      return { x: a.rect.x + a.rect.width / 2, y: a.rect.y + a.rect.height / 2 };
    case 'freehand': {
      const b = boundsOfPoints(a.points);
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    }
    case 'text':
      return {
        x: a.origin.x + a.width / 2,
        y: a.origin.y + (a.fontSize * 1.2) / 2,
      };
  }
}

/**
 * Axis-aligned bounding box of an annotation in its LOCAL (unrotated) frame.
 * The selection overlay rotates this box by `annotation.rotation` about the
 * center when drawing handles.
 */
export function annotationBounds(a: Annotation): Rect {
  'worklet';
  switch (a.type) {
    case 'circle':
      return {
        x: a.center.x - a.radius,
        y: a.center.y - a.radius,
        width: a.radius * 2,
        height: a.radius * 2,
      };
    case 'arrow': {
      const pad = a.headSize + a.strokeWidth;
      const minX = Math.min(a.start.x, a.end.x) - pad;
      const minY = Math.min(a.start.y, a.end.y) - pad;
      const maxX = Math.max(a.start.x, a.end.x) + pad;
      const maxY = Math.max(a.start.y, a.end.y) + pad;
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case 'marker':
      return { ...a.rect };
    case 'freehand': {
      const b = boundsOfPoints(a.points);
      const pad = a.strokeWidth / 2;
      return {
        x: b.x - pad,
        y: b.y - pad,
        width: b.width + pad * 2,
        height: b.height + pad * 2,
      };
    }
    case 'text':
      return {
        x: a.origin.x,
        y: a.origin.y,
        width: a.width,
        height: a.fontSize * 1.2,
      };
  }
}
