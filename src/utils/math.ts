/**
 * Pure 2D affine-matrix math. Every function is marked `worklet` so it can run
 * on the UI thread inside gesture handlers as well as on the JS thread.
 *
 * A matrix `Mat` maps a point p to p' via:
 *   x' = a*x + c*y + e
 *   y' = b*x + d*y + f
 * (the canonical CSS/canvas affine convention).
 */

import type { Rect, SceneTransform, Vec2 } from '../types';

export interface Mat {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export function identity(): Mat {
  'worklet';
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

/** Returns m1 ∘ m2 (applies m2 first, then m1). */
export function multiply(m1: Mat, m2: Mat): Mat {
  'worklet';
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

export function translation(tx: number, ty: number): Mat {
  'worklet';
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

export function scaling(sx: number, sy: number): Mat {
  'worklet';
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
}

export function rotation(theta: number): Mat {
  'worklet';
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

export function invert(m: Mat): Mat {
  'worklet';
  const det = m.a * m.d - m.b * m.c;
  if (det === 0) {
    return identity();
  }
  const inv = 1 / det;
  return {
    a: m.d * inv,
    b: -m.b * inv,
    c: -m.c * inv,
    d: m.a * inv,
    e: (m.c * m.f - m.d * m.e) * inv,
    f: (m.b * m.e - m.a * m.f) * inv,
  };
}

export function applyToPoint(m: Mat, p: Vec2): Vec2 {
  'worklet';
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
  };
}

/** Rotate point `p` by `theta` radians about `center`. */
export function rotatePoint(p: Vec2, center: Vec2, theta: number): Vec2 {
  'worklet';
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export interface Layout {
  width: number;
  height: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * The base fit scale used to "contain" the image inside the on-screen layout,
 * before any user scene scale is applied.
 */
export function fitScale(image: ImageSize, layout: Layout): number {
  'worklet';
  if (image.width <= 0 || image.height <= 0) {
    return 1;
  }
  return Math.min(layout.width / image.width, layout.height / image.height);
}

/**
 * Compose the image→screen matrix:
 *   M = T(center) · R(rotation) · S(fit·userScale) · T(-imageCenter)
 *
 * The on-screen Skia `<Group>` uses `sceneTransforms2d` (below), built from the
 * SAME parameters, so the preview and this matrix stay in lock-step. Gestures
 * use `invert(M)` to map screen touches back into image space.
 */
export function imageToScreenMatrix(
  scene: SceneTransform,
  image: ImageSize,
  layout: Layout
): Mat {
  'worklet';
  const s = fitScale(image, layout) * scene.scale;
  const cx = layout.width / 2;
  const cy = layout.height / 2;
  let m = translation(cx, cy);
  m = multiply(m, rotation(scene.rotation));
  m = multiply(m, scaling(s, s));
  m = multiply(m, translation(-image.width / 2, -image.height / 2));
  return m;
}

/**
 * Skia `Transforms2d` array for the on-screen scene `<Group>`. Applied in order,
 * this reproduces `imageToScreenMatrix` exactly.
 */
export function sceneTransforms2d(
  scene: SceneTransform,
  image: ImageSize,
  layout: Layout
): { translateX: number }[] | object[] {
  'worklet';
  const s = fitScale(image, layout) * scene.scale;
  return [
    { translateX: layout.width / 2 },
    { translateY: layout.height / 2 },
    { rotate: scene.rotation },
    { scaleX: s },
    { scaleY: s },
    { translateX: -image.width / 2 },
    { translateY: -image.height / 2 },
  ];
}

export function clampSizeToMax(
  width: number,
  height: number,
  maxSize?: number
): { width: number; height: number } {
  'worklet';
  if (!maxSize || maxSize <= 0) {
    return { width, height };
  }
  const longest = Math.max(width, height);
  if (longest <= maxSize) {
    return { width, height };
  }
  const k = maxSize / longest;
  return { width: Math.round(width * k), height: Math.round(height * k) };
}

/** Axis-aligned bounding box of a set of points. */
export function boundsOfPoints(points: Vec2[]): Rect {
  'worklet';
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let minX = points[0]!.x;
  let minY = points[0]!.y;
  let maxX = points[0]!.x;
  let maxY = points[0]!.y;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function rectCenter(r: Rect): Vec2 {
  'worklet';
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

export function distance(a: Vec2, b: Vec2): number {
  'worklet';
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Shortest distance from point `p` to segment `a`→`b`. */
export function distanceToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  'worklet';
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return distance(p, a);
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}
