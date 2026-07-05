import { Pressable, StyleSheet, Text } from 'react-native';

export function ToolButton({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        active && styles.active,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      hitSlop={6}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 2,
  },
  active: { backgroundColor: '#1E90FF' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  label: { color: '#FFFFFF', fontSize: 18 },
  activeLabel: { color: '#FFFFFF', fontWeight: '700' },
});
