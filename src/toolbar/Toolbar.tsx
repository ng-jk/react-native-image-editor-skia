import { StyleSheet, View } from 'react-native';

import { useEditor } from '../context/EditorContext';
import type { ToolType } from '../types';
import { ToolButton } from './ToolButton';
import { ColorPicker } from './ColorPicker';
import { CropControls } from './CropControls';
import { RotationSlider } from './RotationSlider';

const TOOLS: { tool: ToolType; label: string }[] = [
  { tool: 'select', label: '⇱' },
  { tool: 'circle', label: '◯' },
  { tool: 'arrow', label: '↗' },
  { tool: 'marker', label: '▬' },
  { tool: 'freehand', label: '✎' },
  { tool: 'text', label: 'T' },
  { tool: 'crop', label: '⛶' },
];

export function Toolbar({ onDone }: { onDone?: () => void }) {
  const {
    tool,
    setTool,
    selectedId,
    setSelectedId,
    canUndo,
    canRedo,
    dispatch,
    doc,
  } = useEditor();

  const cropping = tool === 'crop';

  const deleteSelected = () => {
    if (selectedId) {
      dispatch({ type: 'DELETE_ANNOTATION', id: selectedId });
      setSelectedId(null);
    }
  };

  const bumpScale = (delta: number) => {
    const next = Math.max(0.1, Math.min(4, doc.scene.scale + delta));
    dispatch({ type: 'SET_SCENE', changes: { scale: next } });
  };

  return (
    <View style={styles.container}>
      {cropping ? (
        <>
          <RotationSlider />
          <CropControls />
        </>
      ) : (
        <>
          <View style={styles.topRow}>
            <ToolButton label="↶" disabled={!canUndo} onPress={() => dispatch({ type: 'UNDO' })} />
            <ToolButton label="↷" disabled={!canRedo} onPress={() => dispatch({ type: 'REDO' })} />
            <ToolButton label="−" onPress={() => bumpScale(-0.1)} />
            <ToolButton label="+" onPress={() => bumpScale(0.1)} />
            <ToolButton
              label="🗑"
              disabled={!selectedId}
              onPress={deleteSelected}
            />
            {onDone ? <ToolButton label="Done" active onPress={onDone} /> : null}
          </View>

          <RotationSlider />
          <ColorPicker />

          <View style={styles.toolRow}>
            {TOOLS.map((t) => (
              <ToolButton
                key={t.tool}
                label={t.label}
                active={tool === t.tool}
                onPress={() => {
                  setTool(t.tool);
                  if (t.tool !== 'select') {
                    setSelectedId(null);
                  }
                }}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
