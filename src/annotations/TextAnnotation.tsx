import { useMemo } from 'react';
import { Text, matchFont } from '@shopify/react-native-skia';

import type { TextAnnotation as TextAnnotationType } from '../types';
import { annotationCenter } from './geometry';
import { RotatedGroup } from './RotatedGroup';

/**
 * Renders text using a system font via `matchFont` (no bundled font file
 * required). Honors explicit newlines; automatic width-wrapping is intentionally
 * out of scope for v1 (would require SkParagraph + a shared FontMgr).
 */
export function TextAnnotationView({ a }: { a: TextAnnotationType }) {
  const font = useMemo(
    () =>
      matchFont({
        fontFamily: 'sans-serif',
        fontSize: a.fontSize,
        fontStyle: 'normal',
        fontWeight: 'normal',
      }),
    [a.fontSize]
  );

  const lines = a.text.split('\n');
  const lineHeight = a.fontSize * 1.2;

  return (
    <RotatedGroup center={annotationCenter(a)} rotation={a.rotation}>
      {lines.map((line, i) => (
        <Text
          key={i}
          x={a.origin.x}
          y={a.origin.y + a.fontSize + i * lineHeight}
          text={line}
          font={font}
          color={a.color}
        />
      ))}
    </RotatedGroup>
  );
}
