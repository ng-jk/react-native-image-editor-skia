import type { Annotation } from '../types';

export function getAnnotationById(
  annotations: Annotation[],
  id: string | null
): Annotation | undefined {
  if (!id) {
    return undefined;
  }
  return annotations.find((a) => a.id === id);
}

/** Annotations in paint order (ascending z). */
export function sortedByZ(annotations: Annotation[]): Annotation[] {
  return [...annotations].sort((a, b) => a.z - b.z);
}
