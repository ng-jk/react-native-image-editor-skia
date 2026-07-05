import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { useEditor } from '../context/EditorContext';

const SENSITIVITY = 0.006; // radians per pixel dragged

/**
 * Drag left/right anywhere on the bar to rotate the whole image to ANY angle.
 * Updates are transient during the drag (no history spam) and committed on
 * release. Double-nothing here is fine — the scene re-renders, but rotation is
 * an occasional interaction.
 */
export function RotationSlider() {
  const { doc, dispatch } = useEditor();
  const startRotation = useSharedValue(0);
  const rotationDeg = Math.round((doc.scene.rotation * 180) / Math.PI);

  const setScene = (rotation: number, transient: boolean) =>
    dispatch({ type: 'SET_SCENE', changes: { rotation }, transient });

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      startRotation.value = doc.scene.rotation;
    })
    .onChange((e) => {
      'worklet';
      runOnJS(setScene)(startRotation.value + e.translationX * SENSITIVITY, true);
    })
    .onEnd((e) => {
      'worklet';
      runOnJS(setScene)(startRotation.value + e.translationX * SENSITIVITY, false);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.bar}>
        <Text style={styles.label}>⟲ Rotate  {rotationDeg}°  ⟳</Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
