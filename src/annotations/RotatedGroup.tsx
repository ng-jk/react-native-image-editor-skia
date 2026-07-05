import React from 'react';
import { Group } from '@shopify/react-native-skia';

import type { Vec2 } from '../types';

/**
 * Wraps children in a Skia Group rotated by `rotation` radians about `center`.
 * Every annotation renderer uses this so its stored `rotation` is applied
 * consistently (and identically in the off-screen export path).
 */
export function RotatedGroup({
  center,
  rotation,
  children,
}: {
  center: Vec2;
  rotation: number;
  children: React.ReactNode;
}) {
  if (!rotation) {
    return <>{children}</>;
  }
  return (
    <Group origin={center} transform={[{ rotate: rotation }]}>
      {children}
    </Group>
  );
}
