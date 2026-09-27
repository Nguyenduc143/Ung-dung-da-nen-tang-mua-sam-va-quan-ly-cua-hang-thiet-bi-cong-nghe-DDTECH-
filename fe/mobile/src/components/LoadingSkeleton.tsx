import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

export interface LoadingSkeletonProps {
  borderRadius?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  width?: ViewStyle['width'];
}

export function LoadingSkeleton({
  borderRadius = radius.sm,
  height = 16,
  style,
  width = '100%',
}: LoadingSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { duration: 700, toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { duration: 700, toValue: 0.45, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLabel="Đang tải"
      style={[styles.skeleton, { borderRadius, height, opacity, width }, style]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.border },
});
