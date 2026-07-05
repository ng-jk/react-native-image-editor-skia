/**
 * Public + internal types for the Skia image editor.
 *
 * COORDINATE-SPACE CONTRACT (read this first):
 * Every annotation's geometry is stored in **image space** — the base image's
 * full-resolution pixel coordinate system (0..imageWidth, 0..imageHeight).
 * It is NEVER stored in screen space. A single `imageToScreen` affine matrix
 * maps image space onto the on-screen canvas; its inverse maps touches back.
 * Because of this, export can render the exact same numbers off-screen at native
 * resolution with no rescaling. See `utils/math.ts`.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ToolType =
  | 'select'
  | 'circle'
  | 'arrow'
  | 'marker'
  | 'freehand'
  | 'text'
  | 'crop';

export type AnnotationType = 'circle' | 'arrow' | 'marker' | 'freehand' | 'text';

/**
 * Colors are stored as CSS-style strings ("#RRGGBB" / "#RRGGBBAA" / named).
 * Skia accepts these directly, and they are trivially serializable for history.
 */
export type ColorString = string;

interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  /** Rotation in radians about the annotation's own center. */
  rotation: number;
  /** Paint order; higher = drawn on top / hit-tested first. */
  z: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  center: Vec2;
  radius: number;
  strokeColor: ColorString;
  strokeWidth: number;
  /** Optional fill; undefined = outline only. */
  fill?: ColorString;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  start: Vec2;
  end: Vec2;
  /** Length of the arrowhead barbs, in image pixels. */
  headSize: number;
  strokeColor: ColorString;
  strokeWidth: number;
}

export interface MarkerAnnotation extends BaseAnnotation {
  type: 'marker';
  /** Highlight rectangle, in image space. */
  rect: Rect;
  color: ColorString;
  /** 0..1 — highlighters are semi-transparent. */
  opacity: number;
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand';
  points: Vec2[];
  strokeColor: ColorString;
  strokeWidth: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  /** Top-left origin of the text box, in image space. */
  origin: Vec2;
  text: string;
  color: ColorString;
  fontSize: number;
  /** Wrap width of the text box, in image pixels. */
  width: number;
}

export type Annotation =
  | CircleAnnotation
  | ArrowAnnotation
  | MarkerAnnotation
  | FreehandAnnotation
  | TextAnnotation;

/**
 * Non-destructive image transforms. Nothing is baked into pixels until export,
 * so all of these are undoable.
 */
export interface SceneTransform {
  /** Free-angle rotation of the whole image + its annotations, in radians. */
  rotation: number;
  /** Uniform resize factor applied at export. */
  scale: number;
  /** Crop region in image space, or null for the full image. */
  cropRect: Rect | null;
}

export const IDENTITY_SCENE: SceneTransform = {
  rotation: 0,
  scale: 1,
  cropRect: null,
};

/** The serializable editor document — everything undo/redo tracks. */
export interface EditorDocument {
  annotations: Annotation[];
  scene: SceneTransform;
}

export type OutputFormat = 'png' | 'jpeg';

/**
 * Callback that persists an encoded image to disk. The library has no
 * filesystem access of its own, so the consumer supplies this using whatever fs
 * module they already have (react-native-fs, expo-file-system, etc.). It
 * receives the destination path and the RAW base64 payload (no data-URI prefix).
 */
export type WriteFileFn = (path: string, base64: string) => Promise<void>;

export interface ExportOptions {
  format?: OutputFormat;
  /** JPEG quality 0..100 (ignored for PNG). Default 100. */
  quality?: number;
  /**
   * Clamp the longest output edge to this many pixels (keeps aspect ratio).
   * Guards against OOM when snapshotting very large images. Default: no clamp.
   */
  maxExportSize?: number;
  /**
   * `'base64'` (default) resolves to a base64 string. `'file'` writes the image
   * to `filePath` using `writeFile` and resolves to that path.
   */
  output?: 'base64' | 'file';
  /** Destination path/URI when `output: 'file'`. */
  filePath?: string;
  /** Required when `output: 'file'` — writes the base64 payload to disk. */
  writeFile?: WriteFileFn;
  /**
   * For `output: 'base64'` only. When true (default), returns a
   * `data:image/...;base64,...` URI. When false, returns raw base64 (no prefix).
   */
  dataUri?: boolean;
}

/** Imperative handle exposed via `ref`. */
export interface ImageEditorRef {
  /**
   * Render the current scene off-screen at full resolution. Resolves to base64
   * (default) or, with `output: 'file'`, to the written file path.
   */
  export: (options?: ExportOptions) => Promise<string>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  /** Remove all annotations and reset scene transforms (keeps the base image). */
  reset: () => void;
}

/** Source image: a base64 string (raw or data-URI) or a file/remote URI. */
export type ImageSource =
  | { base64: string }
  | { uri: string };

export interface ImageEditorProps {
  /** Base image to edit. */
  source: ImageSource;
  /** Fired when the user taps the built-in export/done control. */
  onExport?: (base64: string) => void;
  /** Default export options for the built-in export control. */
  exportOptions?: ExportOptions;
  /** Initial stroke color for new shapes. Default "#FF3B30". */
  initialStrokeColor?: ColorString;
  /** Initial text color. Default "#FFFFFF". */
  initialTextColor?: ColorString;
  /** Palette shown in the color picker. */
  palette?: ColorString[];
  /** Hide the built-in toolbar (drive tools yourself via ref/context). */
  hideToolbar?: boolean;
  /** Called whenever the loaded image fails to decode. */
  onError?: (error: Error) => void;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}
