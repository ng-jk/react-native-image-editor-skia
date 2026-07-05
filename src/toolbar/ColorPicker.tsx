import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useEditor } from '../context/EditorContext';
import { getAnnotationById } from '../state/selectors';
import type { ColorString } from '../types';

/**
 * Horizontal swatch strip. Picking a color sets the "current" color used for new
 * shapes and, if an annotation is selected, recolors it (the right field per
 * type). While editing text, it also updates the live text color.
 */
export function ColorPicker() {
  const {
    palette,
    strokeColor,
    setStrokeColor,
    setTextColor,
    selectedId,
    editingTextId,
    annotations,
    dispatch,
  } = useEditor();

  const onPick = (color: ColorString) => {
    setStrokeColor(color);
    setTextColor(color);
    const target = getAnnotationById(annotations, editingTextId ?? selectedId);
    if (target) {
      if (target.type === 'text' || target.type === 'marker') {
        dispatch({ type: 'UPDATE_ANNOTATION', id: target.id, changes: { color } });
      } else {
        dispatch({
          type: 'UPDATE_ANNOTATION',
          id: target.id,
          changes: { strokeColor: color },
        });
      }
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {palette.map((color) => (
        <Pressable key={color} onPress={() => onPick(color)} hitSlop={4}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: color },
              color === strokeColor && styles.selected,
            ]}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  selected: { borderColor: '#FFFFFF', borderWidth: 3 },
});
