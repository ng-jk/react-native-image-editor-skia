import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import type { Annotation, Rect, ToolType, Vec2 } from '../types';
import { useEditor } from '../context/EditorContext';
import {
  FREEHAND_MIN_DISTANCE,
  HANDLE_SIZE,
  HIT_SLOP,
} from '../constants';
import { applyToPoint, distance, invert } from '../utils/math';
import { annotationCenter } from '../annotations/geometry';
import { hitTest } from './hitTest';
import { selectionHandles } from './handles';
import { applyTransformToAnnotation } from './applyTransform';
import type { LiveValues } from './applyTransform';
import {
  makeArrow,
  makeCircle,
  makeFreehand,
  makeMarker,
  makeText,
} from './createAnnotation';

type Mode = 'none' | 'draw' | 'text' | 'move' | 'resize' | 'rotate';

function isDrawTool(tool: ToolType): boolean {
  'worklet';
  return (
    tool === 'circle' ||
    tool === 'arrow' ||
    tool === 'marker' ||
    tool === 'freehand'
  );
}

/**
 * A single composed Pan gesture over the canvas. It branches on the active tool
 * and, in select mode, on where the touch began (rotate handle → rotate, corner
 * handle → resize, body → move, empty → (de)select). All geometry math runs on
 * the UI thread; only final commits hop to JS via runOnJS.
 */
export function useEditorGestures() {
  const editor = useEditor();
  const {
    tool,
    selectedId,
    annotations,
    matrix,
    draw,
    live,
    strokeColor,
    strokeWidth,
    dispatch,
    setSelectedId,
    setEditingTextId,
  } = editor;

  const invMatrix = useMemo(() => invert(matrix), [matrix]);
  const scaleFactor = useMemo(
    () => Math.hypot(matrix.a, matrix.b) || 1,
    [matrix]
  );
  const slopImage = HIT_SLOP / scaleFactor;

  // Per-gesture UI-thread scratch state.
  const mode = useSharedValue<Mode>('none');
  const startImg = useSharedValue<Vec2>({ x: 0, y: 0 });
  const startDist = useSharedValue(0);
  const startAngle = useSharedValue(0);
  const activeId = useSharedValue<string | null>(null);

  // ---- JS-thread commit callbacks --------------------------------------
  const selectId = (id: string | null) => setSelectedId(id);

  const commitCircle = (center: Vec2, radius: number) =>
    dispatch({
      type: 'ADD_ANNOTATION',
      annotation: makeCircle(center, radius, { strokeColor, strokeWidth }),
    });

  const commitArrow = (start: Vec2, end: Vec2) =>
    dispatch({
      type: 'ADD_ANNOTATION',
      annotation: makeArrow(start, end, { strokeColor, strokeWidth }),
    });

  const commitMarker = (rect: Rect) =>
    dispatch({
      type: 'ADD_ANNOTATION',
      annotation: makeMarker(rect, strokeColor),
    });

  const commitFreehand = (points: Vec2[]) =>
    dispatch({
      type: 'ADD_ANNOTATION',
      annotation: makeFreehand(points, { strokeColor, strokeWidth }),
    });

  const placeText = (origin: Vec2) => {
    const annotation = makeText(origin, editor.textColor);
    dispatch({ type: 'ADD_ANNOTATION', annotation });
    setSelectedId(annotation.id);
    setEditingTextId(annotation.id);
  };

  const commitTransform = (id: string | null, vals: LiveValues) => {
    if (!id) {
      return;
    }
    // Skip no-op transforms (a plain tap) so they don't pollute history.
    const identity =
      vals.tx === 0 && vals.ty === 0 && vals.rotate === 0 && vals.scale === 1;
    if (identity) {
      return;
    }
    const target = annotations.find((a) => a.id === id);
    if (!target) {
      return;
    }
    const updated = applyTransformToAnnotation(target, vals);
    dispatch({ type: 'UPDATE_ANNOTATION', id, changes: updated });
  };

  const resetLive = () => {
    live.active.value = false;
    live.tx.value = 0;
    live.ty.value = 0;
    live.rotate.value = 0;
    live.scale.value = 1;
  };

  // ---- The gesture ------------------------------------------------------
  const pan = useMemo(() => {
    return Gesture.Pan()
      .maxPointers(1)
      .onBegin((e) => {
        'worklet';
        if (tool === 'crop') {
          mode.value = 'none';
          return;
        }
        const screen = { x: e.x, y: e.y };
        const img = applyToPoint(invMatrix, screen);
        startImg.value = img;
        activeId.value = selectedId;

        if (isDrawTool(tool)) {
          mode.value = 'draw';
          draw.active.value = true;
          draw.start.value = img;
          draw.current.value = img;
          if (tool === 'freehand') {
            draw.points.value = [img];
          }
          return;
        }

        if (tool === 'text') {
          mode.value = 'text';
          return;
        }

        // select tool: figure out what was grabbed.
        const sel: Annotation | undefined = selectedId
          ? annotations.find((a) => a.id === selectedId)
          : undefined;
        if (sel) {
          const h = selectionHandles(sel, matrix);
          const center = annotationCenter(sel);
          if (distance(screen, h.rotate) <= HANDLE_SIZE * 1.5) {
            mode.value = 'rotate';
            live.origin.value = center;
            live.active.value = true;
            startAngle.value = Math.atan2(img.y - center.y, img.x - center.x);
            return;
          }
          for (let i = 0; i < h.corners.length; i++) {
            if (distance(screen, h.corners[i]!) <= HANDLE_SIZE * 1.5) {
              mode.value = 'resize';
              live.origin.value = center;
              live.active.value = true;
              startDist.value = distance(center, img);
              return;
            }
          }
          // Body of the selected annotation → move it.
          if (hitTest([sel], img, slopImage) === sel.id) {
            mode.value = 'move';
            live.origin.value = center;
            live.active.value = true;
            return;
          }
        }

        // Otherwise (de)select whatever is under the touch.
        const hitId = hitTest(annotations, img, slopImage);
        runOnJS(selectId)(hitId);
        activeId.value = hitId;
        if (hitId) {
          const target = annotations.find((a) => a.id === hitId)!;
          mode.value = 'move';
          live.origin.value = annotationCenter(target);
          live.active.value = true;
        } else {
          mode.value = 'none';
        }
      })
      .onChange((e) => {
        'worklet';
        const screen = { x: e.x, y: e.y };
        const img = applyToPoint(invMatrix, screen);
        switch (mode.value) {
          case 'draw':
            if (tool === 'freehand') {
              const pts = draw.points.value;
              const last = pts[pts.length - 1];
              if (!last || distance(last, img) >= FREEHAND_MIN_DISTANCE) {
                draw.points.value = [...pts, img];
              }
            } else {
              draw.current.value = img;
            }
            break;
          case 'move':
            live.tx.value = img.x - startImg.value.x;
            live.ty.value = img.y - startImg.value.y;
            break;
          case 'resize':
            live.scale.value =
              startDist.value > 0 ? distance(live.origin.value, img) / startDist.value : 1;
            break;
          case 'rotate': {
            const ang = Math.atan2(
              img.y - live.origin.value.y,
              img.x - live.origin.value.x
            );
            live.rotate.value = ang - startAngle.value;
            break;
          }
          default:
            break;
        }
      })
      .onEnd(() => {
        'worklet';
        if (mode.value === 'draw') {
          draw.active.value = false;
          const s = draw.start.value;
          const c = draw.current.value;
          if (tool === 'circle') {
            const r = distance(s, c);
            if (r > 2) runOnJS(commitCircle)(s, r);
          } else if (tool === 'arrow') {
            if (distance(s, c) > 2) runOnJS(commitArrow)(s, c);
          } else if (tool === 'marker') {
            const rect: Rect = {
              x: Math.min(s.x, c.x),
              y: Math.min(s.y, c.y),
              width: Math.abs(c.x - s.x),
              height: Math.abs(c.y - s.y),
            };
            if (rect.width > 2 && rect.height > 2) runOnJS(commitMarker)(rect);
          } else if (tool === 'freehand') {
            const pts = draw.points.value;
            if (pts.length > 1) runOnJS(commitFreehand)(pts);
            draw.points.value = [];
          }
          mode.value = 'none';
          return;
        }

        if (mode.value === 'text') {
          runOnJS(placeText)(startImg.value);
          mode.value = 'none';
          return;
        }

        if (
          mode.value === 'move' ||
          mode.value === 'resize' ||
          mode.value === 'rotate'
        ) {
          const vals: LiveValues = {
            tx: live.tx.value,
            ty: live.ty.value,
            rotate: live.rotate.value,
            scale: live.scale.value,
            origin: live.origin.value,
          };
          runOnJS(commitTransform)(activeId.value, vals);
          runOnJS(resetLive)();
          mode.value = 'none';
        }
      })
      .onFinalize(() => {
        'worklet';
        // Safety: ensure draw preview is cleared if the gesture is cancelled.
        if (draw.active.value && mode.value !== 'draw') {
          draw.active.value = false;
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, selectedId, annotations, matrix, strokeColor, strokeWidth]);

  return pan;
}
