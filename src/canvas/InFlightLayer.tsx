import { Circle, Group, Line, Path, Rect, Skia } from '@shopify/react-native-skia';
import type { SkPath } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { DrawState, EditorContextValue } from '../context/EditorContext';
import { ARROW_HEAD_RATIO, MARKER_OPACITY } from '../constants';
import { withOpacity } from '../utils/color';

/**
 * Renders the shape currently being drawn, bound to the `draw` shared values so
 * it updates on the UI thread. The active tool is fixed for the duration of a
 * draw, so switching on it here is safe. Opacity is 0 when not drawing.
 *
 * Receives `editor` as a prop (context does not cross the Skia Canvas boundary).
 */
export function InFlightLayer({ editor }: { editor: EditorContextValue }) {
  const { tool, draw, strokeColor, strokeWidth } = editor;

  const opacity = useDerivedValue(() => (draw.active.value ? 1 : 0));

  return (
    <Group opacity={opacity}>
      {tool === 'circle' && (
        <CirclePreview draw={draw} color={strokeColor} width={strokeWidth} />
      )}
      {tool === 'arrow' && (
        <ArrowPreview draw={draw} color={strokeColor} width={strokeWidth} />
      )}
      {tool === 'marker' && <MarkerPreview draw={draw} color={strokeColor} />}
      {tool === 'freehand' && (
        <FreehandPreview draw={draw} color={strokeColor} width={strokeWidth} />
      )}
    </Group>
  );
}

function CirclePreview({
  draw,
  color,
  width,
}: {
  draw: DrawState;
  color: string;
  width: number;
}) {
  const cx = useDerivedValue(() => draw.start.value.x);
  const cy = useDerivedValue(() => draw.start.value.y);
  const r = useDerivedValue(() =>
    Math.hypot(
      draw.current.value.x - draw.start.value.x,
      draw.current.value.y - draw.start.value.y
    )
  );
  return (
    <Circle cx={cx} cy={cy} r={r} color={color} style="stroke" strokeWidth={width} />
  );
}

function ArrowPreview({
  draw,
  color,
  width,
}: {
  draw: DrawState;
  color: string;
  width: number;
}) {
  const headSize = width * ARROW_HEAD_RATIO;

  const p1 = useDerivedValue(() => draw.start.value);
  const p2 = useDerivedValue(() => draw.current.value);
  const barb1 = useDerivedValue(() => {
    const s = draw.start.value;
    const e = draw.current.value;
    const angle = Math.atan2(e.y - s.y, e.x - s.x);
    const barb = (Math.PI * 5) / 6;
    return {
      x: e.x + headSize * Math.cos(angle + barb),
      y: e.y + headSize * Math.sin(angle + barb),
    };
  });
  const barb2 = useDerivedValue(() => {
    const s = draw.start.value;
    const e = draw.current.value;
    const angle = Math.atan2(e.y - s.y, e.x - s.x);
    const barb = (Math.PI * 5) / 6;
    return {
      x: e.x + headSize * Math.cos(angle - barb),
      y: e.y + headSize * Math.sin(angle - barb),
    };
  });

  return (
    <Group color={color} style="stroke" strokeWidth={width} strokeCap="round">
      <Line p1={p1} p2={p2} />
      <Line p1={p2} p2={barb1} />
      <Line p1={p2} p2={barb2} />
    </Group>
  );
}

function MarkerPreview({ draw, color }: { draw: DrawState; color: string }) {
  const x = useDerivedValue(() => Math.min(draw.start.value.x, draw.current.value.x));
  const y = useDerivedValue(() => Math.min(draw.start.value.y, draw.current.value.y));
  const w = useDerivedValue(() => Math.abs(draw.current.value.x - draw.start.value.x));
  const h = useDerivedValue(() => Math.abs(draw.current.value.y - draw.start.value.y));
  return <Rect x={x} y={y} width={w} height={h} color={withOpacity(color, MARKER_OPACITY)} />;
}

function FreehandPreview({
  draw,
  color,
  width,
}: {
  draw: DrawState;
  color: string;
  width: number;
}) {
  const path = useDerivedValue<SkPath>(() => {
    const pts = draw.points.value;
    const p = Skia.Path.Make();
    if (pts.length > 0) {
      p.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        p.lineTo(pts[i]!.x, pts[i]!.y);
      }
    }
    return p;
  });
  return (
    <Path
      path={path}
      color={color}
      style="stroke"
      strokeWidth={width}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}
