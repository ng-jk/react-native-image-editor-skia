let counter = 0;

/** Small unique id generator (JS thread only — avoids a nanoid dependency). */
export function genId(prefix = 'a'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
