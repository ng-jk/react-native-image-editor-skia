import React, { useMemo } from 'react';
import {
  Circle,
  Group,
  Line,
  Path,
  Rect,
  Skia,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { EditorContextValue } from '../context/EditorContext';
import { getAnnotationById } from '../state/selectors';
import { selectionHandles } from '../gestures/handles';
import { HANDLE_SIZE } from '../constants';

const SELECTION_COLOR = '#1E90FF';

/**
 * Draws the selection bounding box + resize corners + rotate handle in SCREEN
 * space (outside the scene transform, so handle size is zoom-independent). The
 * overlay hides itself during an active live transform to avoid a stale double.
 */
export function SelectionOverlay({ editor }: { editor: EditorContextValue }) {
  const { annotations, selectedId, matrix, live } = editor;
  const selected = getAnnotationById(annotations, selectedId);

  const opacity = useDerivedValue(() => (live.active.value ? 0 : 1));

  const handles = useMemo(
    () => (selected ? selectionHandles(selected, matrix) : null),
    [selected, matrix]
  );

  const boxPath = useMemo(() => {
    if (!handles) {
      return null;
    }
    const p = Skia.Path.Make();
    const c = handles.corners;
    p.moveTo(c[0].x, c[0].y);
    p.lineTo(c[1].x, c[1].y);
    p.lineTo(c[2].x, c[2].y);
    p.lineTo(c[3].x, c[3].y);
    p.close();
    return p;
  }, [handles]);

  if (!selected || !handles || !boxPath) {
    return null;
  }

  const topMid = {
    x: (handles.corners[0].x + handles.corners[1].x) / 2,
    y: (handles.corners[0].y + handles.corners[1].y) / 2,
  };

  return (
    <Group opacity={opacity}>
      <Path
        path={boxPath}
        color={SELECTION_COLOR}
        style="stroke"
        strokeWidth={2}
      />
      {/* Rotate handle */}
      <Line p1={topMid} p2={handles.rotate} color={SELECTION_COLOR} strokeWidth={2} />
      <Circle cx={handles.rotate.x} cy={handles.rotate.y} r={HANDLE_SIZE / 2} color={SELECTION_COLOR} />
      {/* Corner resize handles (white fill + blue border) */}
      {handles.corners.map((corner, i) => (
        <React.Fragment key={i}>
          <Rect
            x={corner.x - HANDLE_SIZE / 2}
            y={corner.y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            color="#FFFFFF"
          />
          <Rect
            x={corner.x - HANDLE_SIZE / 2}
            y={corner.y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            color={SELECTION_COLOR}
            style="stroke"
            strokeWidth={2}
          />
        </React.Fragment>
      ))}
    </Group>
  );
}
