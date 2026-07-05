import { Circle } from '@shopify/react-native-skia';

import type { CircleAnnotation as CircleAnnotationType } from '../types';
import { RotatedGroup } from './RotatedGroup';

export function CircleAnnotationView({ a }: { a: CircleAnnotationType }) {
  return (
    <RotatedGroup center={a.center} rotation={a.rotation}>
      {a.fill ? (
        <Circle cx={a.center.x} cy={a.center.y} r={a.radius} color={a.fill} />
      ) : null}
      <Circle
        cx={a.center.x}
        cy={a.center.y}
        r={a.radius}
        color={a.strokeColor}
        style="stroke"
        strokeWidth={a.strokeWidth}
      />
    </RotatedGroup>
  );
}
