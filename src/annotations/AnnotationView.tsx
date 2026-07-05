import type { Annotation } from '../types';
import { CircleAnnotationView } from './CircleAnnotation';
import { ArrowAnnotationView } from './ArrowAnnotation';
import { MarkerAnnotationView } from './MarkerAnnotation';
import { FreehandAnnotationView } from './FreehandAnnotation';
import { TextAnnotationView } from './TextAnnotation';

/** Render any annotation by dispatching on its discriminant. */
export function AnnotationView({ a }: { a: Annotation }) {
  switch (a.type) {
    case 'circle':
      return <CircleAnnotationView a={a} />;
    case 'arrow':
      return <ArrowAnnotationView a={a} />;
    case 'marker':
      return <MarkerAnnotationView a={a} />;
    case 'freehand':
      return <FreehandAnnotationView a={a} />;
    case 'text':
      return <TextAnnotationView a={a} />;
    default:
      return null;
  }
}
