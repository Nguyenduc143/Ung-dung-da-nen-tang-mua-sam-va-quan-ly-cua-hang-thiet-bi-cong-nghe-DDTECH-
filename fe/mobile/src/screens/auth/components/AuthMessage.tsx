import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface AuthMessageProps {
  message: string;
  tone?: 'error' | 'success';
}

export function AuthMessage({ message, tone = 'error' }: AuthMessageProps) {
  const isError = tone === 'error';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, isError ? styles.errorContainer : styles.successContainer]}
    >
      <Ionicons
        color={isError ? colors.danger : colors.success}
        name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={20}
      />
      <Text style={[styles.message, isError ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorContainer: { backgroundColor: colors.dangerSoft },
  successContainer: { backgroundColor: colors.successSoft },
  message: { ...typography.bodySmall, flex: 1 },
  errorText: { color: colors.danger },
  successText: { color: colors.success },
});
