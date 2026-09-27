import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme';

interface ModulePlaceholderScreenProps {
  title: string;
  description?: string;
}

export function ModulePlaceholderScreen({
  title,
  description = 'Màn hình sẽ được triển khai ở bước tiếp theo.',
}: ModulePlaceholderScreenProps) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

export const createModulePlaceholderScreen = (
  title: string,
  description?: string,
) => {
  function PlaceholderScreen() {
    return <ModulePlaceholderScreen description={description} title={title} />;
  }

  PlaceholderScreen.displayName = `${title.replace(/\s+/g, '')}PlaceholderScreen`;
  return PlaceholderScreen;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
