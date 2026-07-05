import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { useEditor } from '../context/EditorContext';
import { getAnnotationById } from '../state/selectors';
import { applyToPoint } from '../utils/math';

/**
 * Native TextInput overlaid on the text annotation being edited. Skia can't
 * accept keyboard input, so we edit here and mirror the string back into the
 * annotation (transient updates while typing; a committed update on blur). The
 * Skia text for this annotation is hidden while editing (see AnnotationLayer).
 * Positioning ignores rotation for simplicity.
 */
export function TextInputOverlay() {
  const {
    editingTextId,
    setEditingTextId,
    annotations,
    dispatch,
    matrix,
    setSelectedId,
  } = useEditor();

  const target = getAnnotationById(annotations, editingTextId);
  const isText = target?.type === 'text' ? target : null;
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isText) {
      setValue(isText.text);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTextId]);

  if (!isText) {
    return null;
  }

  const scaleFactor = Math.hypot(matrix.a, matrix.b) || 1;
  const screen = applyToPoint(matrix, isText.origin);
  const fontSize = isText.fontSize * scaleFactor;
  const width = isText.width * scaleFactor;

  const onChange = (text: string) => {
    setValue(text);
    dispatch({
      type: 'UPDATE_ANNOTATION',
      id: isText.id,
      changes: { text },
      transient: true,
    });
  };

  const onDone = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      dispatch({ type: 'DELETE_ANNOTATION', id: isText.id });
      setSelectedId(null);
    } else {
      // Promote the accumulated transient edits into a single history entry.
      dispatch({ type: 'UPDATE_ANNOTATION', id: isText.id, changes: { text: value } });
    }
    setEditingTextId(null);
  };

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChange}
      onBlur={onDone}
      onSubmitEditing={onDone}
      multiline
      blurOnSubmit
      style={[
        styles.input,
        {
          left: screen.x,
          top: screen.y,
          width: Math.max(width, 80),
          fontSize,
          color: isText.color,
          lineHeight: fontSize * 1.2,
        },
      ]}
      placeholder="Text"
      placeholderTextColor="rgba(255,255,255,0.5)"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    position: 'absolute',
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
  },
});
