import React, { useRef, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageEditor, type ImageEditorRef } from 'react-native-image-editor-skia';

// A real photo makes the demo meaningful. Swap for { base64: '...' } to test the
// base64 input path. (Requires network on the device/simulator.)
const SAMPLE = {
  uri: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=1200',
};

export default function App() {
  const editorRef = useRef<ImageEditorRef>(null);
  const [output, setOutput] = useState<string | null>(null);

  const handleExport = (base64: string) => {
    // `base64` is a data URI by default; feed it straight into <Image>.
    setOutput(base64);
  };

  const exportViaRef = async () => {
    const result = await editorRef.current?.export({
      format: 'jpeg',
      quality: 90,
      maxExportSize: 2000,
    });
    if (result) {
      setOutput(result);
    }
  };

  if (output) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Exported result</Text>
        <ScrollView contentContainerStyle={styles.resultWrap}>
          <Image
            source={{ uri: output }}
            style={styles.result}
            resizeMode="contain"
          />
          <Text style={styles.meta} numberOfLines={2}>
            {output.slice(0, 64)}…
          </Text>
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={() => setOutput(null)}>
          <Text style={styles.buttonText}>Back to editor</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.editor}>
        <ImageEditor
          ref={editorRef}
          source={SAMPLE}
          onExport={handleExport}
          onError={(e) => console.warn('Editor error', e)}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={exportViaRef}>
        <Text style={styles.buttonText}>Export via ref (JPEG q90)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  editor: { flex: 1 },
  heading: { color: '#fff', fontSize: 18, fontWeight: '700', padding: 16 },
  resultWrap: { alignItems: 'center', padding: 16 },
  result: { width: '100%', height: 400, backgroundColor: '#111' },
  meta: { color: '#888', fontSize: 12, marginTop: 12 },
  button: {
    backgroundColor: '#1E90FF',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
