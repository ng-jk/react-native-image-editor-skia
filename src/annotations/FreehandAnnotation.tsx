import { useMemo } from 'react';
import { Path } from '@shopify/react-native-skia';

import type { FreehandAnnotation as FreehandAnnotationType } from '../types';
import { annotationCenter, buildFreehandPath } from './geometry';
import { RotatedGroup } from './RotatedGroup';

export function FreehandAnnotationView({ a }: { a: FreehandAnnotationType }) {
  const path = useMemo(() => buildFreehandPath(a.points), [a.points]);
  return (
    <RotatedGroup center={annotationCenter(a)} rotation={a.rotation}>
      <Path
        path={path}
        color={a.strokeColor}
        style="stroke"
        strokeWidth={a.strokeWidth}
        strokeCap="round"
        strokeJoin="round"
      />
    </RotatedGroup>
  );
}
