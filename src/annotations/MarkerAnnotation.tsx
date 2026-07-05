import { Rect } from '@shopify/react-native-skia';

import type { MarkerAnnotation as MarkerAnnotationType } from '../types';
import { annotationCenter } from './geometry';
import { RotatedGroup } from './RotatedGroup';
import { withOpacity } from '../utils/color';

export function MarkerAnnotationView({ a }: { a: MarkerAnnotationType }) {
  return (
    <RotatedGroup center={annotationCenter(a)} rotation={a.rotation}>
      <Rect
        x={a.rect.x}
        y={a.rect.y}
        width={a.rect.width}
        height={a.rect.height}
        color={withOpacity(a.color, a.opacity)}
      />
    </RotatedGroup>
  );
}
