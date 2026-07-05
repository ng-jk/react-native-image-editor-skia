import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { SkImage } from '@shopify/react-native-skia';

import type { ExportOptions, ImageEditorProps, ImageEditorRef } from './types';
import { EditorProvider, useEditor } from './context/EditorContext';
import { useLoadedImage } from './image/useLoadedImage';
import { EditorCanvas } from './canvas/EditorCanvas';
import { TextInputOverlay } from './toolbar/TextInputOverlay';
import { Toolbar } from './toolbar/Toolbar';
import { exportImage } from './export/exportImage';

/**
 * Interactive Skia image editor. Loads a base64/URI image, lets the user draw
 * circles/arrows/markers/freehand/text, crop, free-rotate and resize, then
 * exports full-resolution base64 (via ref `export()` or the built-in Done
 * button + `onExport`).
 */
export const ImageEditor = forwardRef<ImageEditorRef, ImageEditorProps>(
  function ImageEditor(props, ref) {
    const { source, onError, style } = props;
    const { image, width, height, loading, error } = useLoadedImage(source);

    useEffect(() => {
      if (error) {
        onError?.(error);
      }
    }, [error, onError]);

    if (error) {
      return (
        <View style={[styles.center, style]}>
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      );
    }

    if (loading || !image) {
      return (
        <View style={[styles.center, style]}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      );
    }

    return (
      <GestureHandlerRootView style={[styles.root, style]}>
        <EditorProvider
          imageSize={{ width, height }}
          initialStrokeColor={props.initialStrokeColor}
          initialTextColor={props.initialTextColor}
          palette={props.palette}
        >
          <EditorBody ref={ref} image={image} {...props} />
        </EditorProvider>
      </GestureHandlerRootView>
    );
  }
);

interface EditorBodyProps extends ImageEditorProps {
  image: SkImage;
}

const EditorBody = forwardRef<ImageEditorRef, EditorBodyProps>(
  function EditorBody({ image, onExport, exportOptions, hideToolbar }, ref) {
    const editor = useEditor();

    const runExport = useCallback(
      (options?: ExportOptions) =>
        exportImage({
          image,
          annotations: editor.doc.annotations,
          scene: editor.doc.scene,
          imageWidth: editor.imageSize.width,
          imageHeight: editor.imageSize.height,
          options: options ?? exportOptions,
        }),
      [image, editor.doc, editor.imageSize, exportOptions]
    );

    useImperativeHandle(
      ref,
      (): ImageEditorRef => ({
        export: runExport,
        undo: () => editor.dispatch({ type: 'UNDO' }),
        redo: () => editor.dispatch({ type: 'REDO' }),
        canUndo: () => editor.canUndo,
        canRedo: () => editor.canRedo,
        reset: () => editor.dispatch({ type: 'RESET' }),
      }),
      [runExport, editor]
    );

    const onDone = useCallback(async () => {
      const base64 = await runExport();
      onExport?.(base64);
    }, [runExport, onExport]);

    return (
      <View style={styles.root}>
        <View style={styles.canvasWrap}>
          <EditorCanvas image={image} />
          <TextInputOverlay />
        </View>
        {hideToolbar ? null : <Toolbar onDone={onExport ? onDone : undefined} />}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  canvasWrap: { flex: 1, position: 'relative' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  errorText: { color: '#FF6B6B', fontSize: 16 },
});
