export { ImageEditor } from './ImageEditor';

export type {
  ImageEditorProps,
  ImageEditorRef,
  ImageSource,
  ExportOptions,
  WriteFileFn,
  OutputFormat,
  Annotation,
  AnnotationType,
  CircleAnnotation,
  ArrowAnnotation,
  MarkerAnnotation,
  FreehandAnnotation,
  TextAnnotation,
  SceneTransform,
  ToolType,
  ColorString,
  Vec2,
  Rect,
} from './types';

// Advanced: build a custom UI on top of the editor state/context.
export { EditorProvider, useEditor } from './context/EditorContext';
export { exportImage } from './export/exportImage';

export {
  DEFAULT_PALETTE,
  DEFAULT_STROKE_COLOR,
  DEFAULT_TEXT_COLOR,
} from './constants';
