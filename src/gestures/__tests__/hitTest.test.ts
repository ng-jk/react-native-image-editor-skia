import { hitTest } from '../hitTest';
import type { Annotation } from '../../types';

const circle: Annotation = {
  id: 'c1',
  type: 'circle',
  rotation: 0,
  z: 1,
  center: { x: 100, y: 100 },
  radius: 40,
  strokeColor: '#fff',
  strokeWidth: 6,
  fill: '#f00',
};

const marker: Annotation = {
  id: 'm1',
  type: 'marker',
  rotation: 0,
  z: 2,
  rect: { x: 50, y: 50, width: 200, height: 100 },
  color: '#ff0',
  opacity: 0.4,
};

describe('hitTest', () => {
  it('hits a filled circle from inside', () => {
    expect(hitTest([circle], { x: 110, y: 110 }, 0)).toBe('c1');
  });

  it('misses outside the circle', () => {
    expect(hitTest([circle], { x: 300, y: 300 }, 0)).toBeNull();
  });

  it('returns the top-most (highest z) annotation on overlap', () => {
    // Point (110,110) is inside both the circle and the marker; marker has higher z.
    expect(hitTest([circle, marker], { x: 110, y: 110 }, 0)).toBe('m1');
  });

  it('respects rotation when hit-testing a rotated marker', () => {
    const rotated: Annotation = { ...marker, id: 'r1', rotation: Math.PI / 2 };
    // A point far along the (unrotated) width axis should miss once rotated 90°.
    const p = { x: 240, y: 100 };
    expect(hitTest([marker], p, 0)).toBe('m1');
    expect(hitTest([rotated], p, 0)).toBeNull();
  });
});
