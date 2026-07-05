import { useMemo } from 'react';
import { Path } from '@shopify/react-native-skia';

import type { ArrowAnnotation as ArrowAnnotationType } from '../types';
import { buildArrowPath } from './geometry';
import { annotationCenter } from './geometry';
import { RotatedGroup } from './RotatedGroup';

export function ArrowAnnotationView({ a }: { a: ArrowAnnotationType }) {
  const path = useMemo(
    () => buildArrowPath(a.start, a.end, a.headSize),
    [a.start, a.end, a.headSize]
  );
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
