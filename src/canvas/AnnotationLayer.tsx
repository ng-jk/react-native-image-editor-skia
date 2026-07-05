import { Group } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import type { EditorContextValue } from '../context/EditorContext';
import { sortedByZ } from '../state/selectors';
import { AnnotationView } from '../annotations/AnnotationView';

/**
 * Renders all committed annotations in paint order. The selected annotation is
 * wrapped in a Group whose transform is driven by the `live` shared values, so
 * move/resize/rotate previews run on the UI thread with zero React re-renders.
 * When idle the live transform is identity, so this is a no-op visually.
 */
export function AnnotationLayer({ editor }: { editor: EditorContextValue }) {
  const { annotations, selectedId, live, editingTextId } = editor;

  const liveTransform = useDerivedValue(() => [
    { translateX: live.tx.value },
    { translateY: live.ty.value },
    { rotate: live.rotate.value },
    { scale: live.scale.value },
  ]);
  const liveOrigin = useDerivedValue(() => live.origin.value);

  return (
    <>
      {sortedByZ(annotations).map((a) => {
        // Hide the text annotation currently being edited in the native overlay.
        if (a.type === 'text' && a.id === editingTextId) {
          return null;
        }
        if (a.id === selectedId) {
          return (
            <Group key={a.id} origin={liveOrigin} transform={liveTransform}>
              <AnnotationView a={a} />
            </Group>
          );
        }
        return <AnnotationView key={a.id} a={a} />;
      })}
    </>
  );
}
