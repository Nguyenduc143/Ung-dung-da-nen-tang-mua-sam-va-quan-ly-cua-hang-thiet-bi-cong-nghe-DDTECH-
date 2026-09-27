import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface SpecificationListProps {
  specifications: Record<string, unknown> | null;
}

const labels: Record<string, string> = {
  battery: 'Pin',
  camera: 'Camera',
  color: 'Màu sắc',
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  screen: 'Màn hình',
  storage: 'Bộ nhớ',
};

const toLabel = (key: string): string => labels[key.toLowerCase()]
  ?? key.replace(/[_-]+/g, ' ').replace(/^./, (character) => character.toUpperCase());

const toDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(toDisplayValue).join(', ');
  if (typeof value === 'object') return Object.values(value).map(toDisplayValue).join(', ');
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  return String(value);
};

export function SpecificationList({ specifications }: SpecificationListProps) {
  const entries = Object.entries(specifications ?? {});
  if (entries.length === 0) {
    return <Text style={styles.empty}>Thông số kỹ thuật đang được cập nhật.</Text>;
  }

  return (
    <View>
      {entries.map(([key, value], index) => (
        <View key={key} style={[styles.row, index % 2 === 0 && styles.alternateRow]}>
          <Text style={styles.label}>{toLabel(key)}</Text>
          <Text style={styles.value}>{toDisplayValue(value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  alternateRow: { backgroundColor: colors.surfaceMuted },
  label: { ...typography.bodySmall, width: '38%', color: colors.textSecondary },
  value: { ...typography.bodySmallSemibold, flex: 1, color: colors.textPrimary },
  empty: { ...typography.bodySmall, color: colors.textMuted },
});
