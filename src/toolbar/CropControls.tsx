import { StyleSheet, View } from 'react-native';

import { useEditor } from '../context/EditorContext';
import { ToolButton } from './ToolButton';

/** Apply / reset / cancel controls shown while the crop tool is active. */
export function CropControls() {
  const { cropRectSV, dispatch, setTool, imageSize } = useEditor();

  const apply = () => {
    const r = cropRectSV.value;
    // Ignore a degenerate crop.
    const isFull =
      r.x <= 0 &&
      r.y <= 0 &&
      r.width >= imageSize.width &&
      r.height >= imageSize.height;
    dispatch({
      type: 'SET_SCENE',
      changes: { cropRect: isFull ? null : { ...r } },
    });
    setTool('select');
  };

  const reset = () => {
    dispatch({ type: 'SET_SCENE', changes: { cropRect: null } });
    setTool('select');
  };

  return (
    <View style={styles.row}>
      <ToolButton label="✕ Cancel" onPress={() => setTool('select')} />
      <ToolButton label="↺ Reset" onPress={reset} />
      <ToolButton label="✓ Apply" active onPress={apply} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
