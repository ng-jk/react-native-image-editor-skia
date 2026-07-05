import type { Annotation, Vec2 } from '../types';

export interface LiveValues {
  tx: number;
  ty: number;
  rotate: number;
  scale: number;
  origin: Vec2;
}

/**
 * Bake a live move/resize/rotate transform into an annotation's stored geometry.
 * This MUST match the on-screen preview (AnnotationLayer applies, in order:
 * translate → rotate(about origin) → scale(about origin)). Rotation is folded
 * into the annotation's `rotation` field (also about its center), so only scale
 * and translate touch geometry here.
 */
export function applyTransformToAnnotation(
  a: Annotation,
  live: LiveValues
): Annotation {
  const { scale: s, origin: o, tx, ty, rotate } = live;
  const map = (p: Vec2): Vec2 => ({
    x: o.x + (p.x - o.x) * s + tx,
    y: o.y + (p.y - o.y) * s + ty,
  });
  const rotation = a.rotation + rotate;

  switch (a.type) {
    case 'circle':
      return {
        ...a,
        center: map(a.center),
        radius: a.radius * s,
        strokeWidth: a.strokeWidth * s,
        rotation,
      };
    case 'arrow':
      return {
        ...a,
        start: map(a.start),
        end: map(a.end),
        headSize: a.headSize * s,
        strokeWidth: a.strokeWidth * s,
        rotation,
      };
    case 'marker': {
      const tl = map({ x: a.rect.x, y: a.rect.y });
      return {
        ...a,
        rect: {
          x: tl.x,
          y: tl.y,
          width: a.rect.width * s,
          height: a.rect.height * s,
        },
        rotation,
      };
    }
    case 'freehand':
      return {
        ...a,
        points: a.points.map(map),
        strokeWidth: a.strokeWidth * s,
        rotation,
      };
    case 'text':
      return {
        ...a,
        origin: map(a.origin),
        fontSize: a.fontSize * s,
        width: a.width * s,
        rotation,
      };
  }
}
