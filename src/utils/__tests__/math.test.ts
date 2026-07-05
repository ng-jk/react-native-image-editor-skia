import {
  applyToPoint,
  distanceToSegment,
  imageToScreenMatrix,
  invert,
  multiply,
  rotatePoint,
} from '../math';
import { IDENTITY_SCENE } from '../../types';

describe('affine math', () => {
  it('inverts a matrix so M · M⁻¹ round-trips a point', () => {
    const m = imageToScreenMatrix(
      { ...IDENTITY_SCENE, rotation: 0.7, scale: 1.3 },
      { width: 800, height: 600 },
      { width: 300, height: 400 }
    );
    const inv = invert(m);
    const p = { x: 123, y: 456 };
    const back = applyToPoint(inv, applyToPoint(m, p));
    expect(back.x).toBeCloseTo(p.x, 3);
    expect(back.y).toBeCloseTo(p.y, 3);
  });

  it('maps the image center to the layout center', () => {
    const image = { width: 800, height: 600 };
    const layout = { width: 300, height: 400 };
    const m = imageToScreenMatrix(IDENTITY_SCENE, image, layout);
    const center = applyToPoint(m, { x: 400, y: 300 });
    expect(center.x).toBeCloseTo(150, 3);
    expect(center.y).toBeCloseTo(200, 3);
  });

  it('multiply composes translation then scaling correctly', () => {
    const t = { a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 };
    const s = { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 };
    // Apply s first, then t.
    const m = multiply(t, s);
    const p = applyToPoint(m, { x: 5, y: 5 });
    expect(p).toEqual({ x: 20, y: 30 });
  });

  it('rotatePoint by 90° about origin', () => {
    const r = rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
    expect(r.x).toBeCloseTo(0, 6);
    expect(r.y).toBeCloseTo(1, 6);
  });

  it('distanceToSegment returns perpendicular distance', () => {
    const d = distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(3, 6);
  });
});
