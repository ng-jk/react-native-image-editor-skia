import {
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  matchFont,
} from '@shopify/react-native-skia';
import type { SkCanvas, SkImage } from '@shopify/react-native-skia';

import type { Annotation } from '../types';
import { sortedByZ } from '../state/selectors';
import { annotationCenter, buildArrowPath, buildFreehandPath } from '../annotations/geometry';
import { withOpacity } from '../utils/color';

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Imperative draw of the base image + all annotations onto `canvas`, in IMAGE
 * space. Shared by the off-screen export path. Mirrors the declarative on-screen
 * renderers (same geometry, same rotation-about-center), so exports match the
 * preview. The caller sets up the output transform + clip before calling this.
 */
export function drawScene(
  canvas: SkCanvas,
  image: SkImage,
  annotations: Annotation[]
): void {
  canvas.drawImage(image, 0, 0);
  for (const a of sortedByZ(annotations)) {
    drawAnnotation(canvas, a);
  }
}

function strokePaint(color: string, width: number) {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setAntiAlias(true);
  paint.setStrokeCap(StrokeCap.Round);
  paint.setStrokeJoin(StrokeJoin.Round);
  return paint;
}

function fillPaint(color: string) {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Fill);
  paint.setAntiAlias(true);
  return paint;
}

function drawAnnotation(canvas: SkCanvas, a: Annotation): void {
  const center = annotationCenter(a);
  canvas.save();
  if (a.rotation) {
    canvas.translate(center.x, center.y);
    canvas.rotate(a.rotation * RAD_TO_DEG, 0, 0);
    canvas.translate(-center.x, -center.y);
  }

  switch (a.type) {
    case 'circle': {
      if (a.fill) {
        canvas.drawCircle(a.center.x, a.center.y, a.radius, fillPaint(a.fill));
      }
      canvas.drawCircle(
        a.center.x,
        a.center.y,
        a.radius,
        strokePaint(a.strokeColor, a.strokeWidth)
      );
      break;
    }
    case 'arrow': {
      const path = buildArrowPath(a.start, a.end, a.headSize);
      canvas.drawPath(path, strokePaint(a.strokeColor, a.strokeWidth));
      path.dispose?.();
      break;
    }
    case 'marker': {
      const rect = Skia.XYWHRect(
        a.rect.x,
        a.rect.y,
        a.rect.width,
        a.rect.height
      );
      canvas.drawRect(rect, fillPaint(withOpacity(a.color, a.opacity)));
      break;
    }
    case 'freehand': {
      const path = buildFreehandPath(a.points);
      canvas.drawPath(path, strokePaint(a.strokeColor, a.strokeWidth));
      path.dispose?.();
      break;
    }
    case 'text': {
      const font = matchFont({
        fontFamily: 'sans-serif',
        fontSize: a.fontSize,
        fontStyle: 'normal',
        fontWeight: 'normal',
      });
      const paint = fillPaint(a.color);
      const lineHeight = a.fontSize * 1.2;
      a.text.split('\n').forEach((line, i) => {
        canvas.drawText(
          line,
          a.origin.x,
          a.origin.y + a.fontSize + i * lineHeight,
          paint,
          font
        );
      });
      break;
    }
  }

  canvas.restore();
}
