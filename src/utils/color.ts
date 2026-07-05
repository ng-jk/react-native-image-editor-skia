import type { ColorString } from '../types';

/**
 * Apply an opacity (0..1) to a hex color string, returning an 8-digit hex
 * ("#RRGGBBAA"). Used by the marker/highlighter which draws semi-transparently.
 * Non-hex inputs (named colors, rgba(...)) are returned unchanged.
 */
export function withOpacity(color: ColorString, opacity: number): ColorString {
  const clamped = Math.max(0, Math.min(1, opacity));
  const hex = color.trim();
  if (!hex.startsWith('#')) {
    return hex;
  }
  let r: string;
  let g: string;
  let b: string;
  if (hex.length === 4) {
    // #RGB
    r = hex[1]! + hex[1]!;
    g = hex[2]! + hex[2]!;
    b = hex[3]! + hex[3]!;
  } else if (hex.length === 7 || hex.length === 9) {
    // #RRGGBB or #RRGGBBAA (ignore existing alpha)
    r = hex.slice(1, 3);
    g = hex.slice(3, 5);
    b = hex.slice(5, 7);
  } else {
    return hex;
  }
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}${a}`;
}
