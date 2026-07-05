import type {
  Annotation,
  ColorString,
  Rect,
  TextAnnotation,
  Vec2,
} from '../types';
import {
  ARROW_HEAD_RATIO,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_WIDTH,
  MARKER_OPACITY,
} from '../constants';
import { genId } from '../utils/id';

export interface DrawStyle {
  strokeColor: ColorString;
  strokeWidth: number;
}

export function makeCircle(
  center: Vec2,
  radius: number,
  style: DrawStyle
): Annotation {
  return {
    id: genId('circle'),
    type: 'circle',
    rotation: 0,
    z: 0,
    center,
    radius,
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
  };
}

export function makeArrow(start: Vec2, end: Vec2, style: DrawStyle): Annotation {
  return {
    id: genId('arrow'),
    type: 'arrow',
    rotation: 0,
    z: 0,
    start,
    end,
    headSize: style.strokeWidth * ARROW_HEAD_RATIO,
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
  };
}

export function makeMarker(rect: Rect, color: ColorString): Annotation {
  return {
    id: genId('marker'),
    type: 'marker',
    rotation: 0,
    z: 0,
    rect,
    color,
    opacity: MARKER_OPACITY,
  };
}

export function makeFreehand(points: Vec2[], style: DrawStyle): Annotation {
  return {
    id: genId('freehand'),
    type: 'freehand',
    rotation: 0,
    z: 0,
    points,
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
  };
}

export function makeText(
  origin: Vec2,
  color: ColorString,
  fontSize = DEFAULT_FONT_SIZE
): TextAnnotation {
  return {
    id: genId('text'),
    type: 'text',
    rotation: 0,
    z: 0,
    origin,
    text: '',
    color,
    fontSize,
    width: DEFAULT_TEXT_WIDTH,
  };
}
