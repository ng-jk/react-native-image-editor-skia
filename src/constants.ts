import type { ColorString } from './types';

/** Default stroke width (in image pixels) for new shapes. */
export const DEFAULT_STROKE_WIDTH = 8;

/** Default font size (in image pixels) for new text annotations. */
export const DEFAULT_FONT_SIZE = 48;

/** Default wrap width (in image pixels) for new text boxes. */
export const DEFAULT_TEXT_WIDTH = 400;

/** Semi-transparent opacity for the marker/highlighter tool. */
export const MARKER_OPACITY = 0.4;

/** Arrowhead barb length as a multiple of stroke width. */
export const ARROW_HEAD_RATIO = 4;

/** Touch slop (in screen points) added to hit-test radii for easier selection. */
export const HIT_SLOP = 12;

/** On-screen size (points) of selection handles. */
export const HANDLE_SIZE = 14;

/** Distance (points) the rotate handle sits above the selection's top edge. */
export const ROTATE_HANDLE_OFFSET = 36;

/** Max entries retained in the undo/redo history. */
export const MAX_HISTORY = 50;

/** Minimum spacing (image px) between sampled freehand points. */
export const FREEHAND_MIN_DISTANCE = 3;

export const DEFAULT_STROKE_COLOR: ColorString = '#FF3B30';
export const DEFAULT_TEXT_COLOR: ColorString = '#FFFFFF';

export const DEFAULT_PALETTE: ColorString[] = [
  '#FF3B30', // red
  '#FF9500', // orange
  '#FFCC00', // yellow
  '#34C759', // green
  '#007AFF', // blue
  '#5856D6', // indigo
  '#AF52DE', // purple
  '#FFFFFF', // white
  '#000000', // black
];
