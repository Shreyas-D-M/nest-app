import { StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface LoadingSkeletonProps {
  height?: number;
  count?: number;
  borderRadius?: number;
}

export function LoadingSkeleton({
  height = 96,
  count = 2,
  borderRadius = radius.md,
}: LoadingSkeletonProps): ReactElement {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container}>
      {items.map((key) => (
        <View
          key={key}
          style={[styles.skeleton, { height, borderRadius }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    width: '100%',
  },
  skeleton: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});
