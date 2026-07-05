import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import type {
  Annotation,
  ColorString,
  EditorDocument,
  Rect,
  ToolType,
  Vec2,
} from '../types';
import {
  DEFAULT_PALETTE,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_COLOR,
} from '../constants';
import { useEditorReducer } from '../state/useEditorReducer';
import type { EditorAction, EditorState } from '../state/useEditorReducer';
import { canRedo, canUndo } from '../state/history';
import { identity, imageToScreenMatrix } from '../utils/math';
import type { Mat } from '../utils/math';

export interface Size {
  width: number;
  height: number;
}

/** Live geometry of a shape currently being drawn (UI-thread shared values). */
export interface DrawState {
  active: SharedValue<boolean>;
  start: SharedValue<Vec2>;
  current: SharedValue<Vec2>;
  points: SharedValue<Vec2[]>;
}

/** Live transform applied to the selected annotation during move/resize/rotate. */
export interface LiveTransformState {
  active: SharedValue<boolean>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  rotate: SharedValue<number>;
  scale: SharedValue<number>;
  origin: SharedValue<Vec2>;
}

export interface EditorContextValue {
  // Document + history
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  doc: EditorDocument;
  annotations: Annotation[];
  canUndo: boolean;
  canRedo: boolean;

  // Tool + selection
  tool: ToolType;
  setTool: (t: ToolType) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  // Style
  strokeColor: ColorString;
  setStrokeColor: (c: ColorString) => void;
  textColor: ColorString;
  setTextColor: (c: ColorString) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  palette: ColorString[];

  // Text editing overlay
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  // Geometry
  layout: Size;
  setLayout: (s: Size) => void;
  imageSize: Size;
  /** image→screen affine matrix (JS thread). */
  matrix: Mat;
  /** image→screen affine matrix mirrored for worklet/UI-thread reads. */
  matrixSV: SharedValue<Mat>;

  // Live gesture shared values
  draw: DrawState;
  live: LiveTransformState;

  /** In-progress crop rectangle (image space) while the crop tool is active. */
  cropRectSV: SharedValue<Rect>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within <EditorProvider>');
  }
  return ctx;
}

export function EditorProvider({
  imageSize,
  initialStrokeColor = DEFAULT_STROKE_COLOR,
  initialTextColor = DEFAULT_TEXT_COLOR,
  palette = DEFAULT_PALETTE,
  children,
}: {
  imageSize: Size;
  initialStrokeColor?: ColorString;
  initialTextColor?: ColorString;
  palette?: ColorString[];
  children: React.ReactNode;
}) {
  const [state, dispatch] = useEditorReducer();
  const [tool, setTool] = useState<ToolType>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState(initialStrokeColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [layout, setLayout] = useState<Size>({ width: 1, height: 1 });

  const doc = state.present;

  // Draw shared values.
  const drawActive = useSharedValue(false);
  const drawStart = useSharedValue<Vec2>({ x: 0, y: 0 });
  const drawCurrent = useSharedValue<Vec2>({ x: 0, y: 0 });
  const drawPoints = useSharedValue<Vec2[]>([]);

  // Live transform shared values.
  const liveActive = useSharedValue(false);
  const liveTx = useSharedValue(0);
  const liveTy = useSharedValue(0);
  const liveRotate = useSharedValue(0);
  const liveScale = useSharedValue(1);
  const liveOrigin = useSharedValue<Vec2>({ x: 0, y: 0 });

  const matrixSV = useSharedValue<Mat>(identity());

  const cropRectSV = useSharedValue<Rect>({
    x: 0,
    y: 0,
    width: imageSize.width,
    height: imageSize.height,
  });

  const matrix = useMemo(
    () => imageToScreenMatrix(doc.scene, imageSize, layout),
    [doc.scene, imageSize, layout]
  );

  // Mirror the JS-thread matrix into the shared value for worklet reads.
  useEffect(() => {
    matrixSV.value = matrix;
  }, [matrix, matrixSV]);

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      dispatch,
      doc,
      annotations: doc.annotations,
      canUndo: canUndo(state),
      canRedo: canRedo(state),
      tool,
      setTool,
      selectedId,
      setSelectedId,
      strokeColor,
      setStrokeColor,
      textColor,
      setTextColor,
      strokeWidth,
      setStrokeWidth,
      palette,
      editingTextId,
      setEditingTextId,
      layout,
      setLayout,
      imageSize,
      matrix,
      matrixSV,
      draw: {
        active: drawActive,
        start: drawStart,
        current: drawCurrent,
        points: drawPoints,
      },
      live: {
        active: liveActive,
        tx: liveTx,
        ty: liveTy,
        rotate: liveRotate,
        scale: liveScale,
        origin: liveOrigin,
      },
      cropRectSV,
    }),
    // Shared values are stable refs; only re-memoize on JS-state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state,
      doc,
      tool,
      selectedId,
      strokeColor,
      textColor,
      strokeWidth,
      palette,
      editingTextId,
      layout,
      imageSize,
      matrix,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
