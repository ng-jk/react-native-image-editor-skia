import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import { useEditor } from '../context/EditorContext';
import { sceneTransforms2d } from '../utils/math';
import { useEditorGestures } from '../gestures/useEditorGestures';
import { useCropGesture } from '../gestures/useCropGesture';
import { BaseImageLayer } from './BaseImageLayer';
import { AnnotationLayer } from './AnnotationLayer';
import { InFlightLayer } from './InFlightLayer';
import { SelectionOverlay } from './SelectionOverlay';
import { CropOverlay } from './CropOverlay';

/**
 * The Skia canvas host. Layers, under one scene `<Group>` transform:
 *   base image → committed annotations → in-flight draft
 * plus screen-space overlays (selection handles, crop UI). A single composed
 * gesture drives all editing.
 *
 * IMPORTANT: React Context does NOT cross the Skia `<Canvas>` boundary — Skia
 * renders Canvas children with its own reconciler, so a Provider mounted outside
 * the Canvas is invisible inside it. Every Canvas child therefore receives the
 * whole editor value via an `editor` PROP instead of calling `useEditor()`.
 * Also, `<Canvas onLayout>` is unsupported on the New Architecture, so we measure
 * on a wrapping `<View>`.
 */
export function EditorCanvas({ image }: { image: SkImage }) {
  const editor = useEditor();
  const { doc, imageSize, setLayout, layout } = editor;

  const pan = useEditorGestures();
  const cropPan = useCropGesture();
  const gesture = useMemo(() => Gesture.Race(cropPan, pan), [cropPan, pan]);

  const transform = useMemo(
    () => sceneTransforms2d(doc.scene, imageSize, layout),
    [doc.scene, imageSize, layout]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.fill}>
          <Group transform={transform as never}>
            <BaseImageLayer image={image} size={imageSize} />
            <AnnotationLayer editor={editor} />
            <InFlightLayer editor={editor} />
          </Group>
          <SelectionOverlay editor={editor} />
          <CropOverlay editor={editor} />
        </Canvas>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
