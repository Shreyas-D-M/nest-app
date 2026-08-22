import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTranslator } from '@nest/i18n';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';
import { apiUrl, fetchApiLiveness } from '@/lib/api';

const t = createTranslator('en');

/**
 * Foundation screen.
 *
 * Not a product screen. It exists to prove the stack end to end — design tokens
 * reaching components, TanStack Query wired up, and the app able to reach the
 * API — which is what Phase 0 is for. The home screen described in
 * 04_DESIGN_SYSTEM.md arrives with the customer booking phase.
 */
export default function FoundationScreen(): ReactElement {
  const theme = useTheme();

  // Manual only: a foundation screen should not poll the API on mount.
  const health = useQuery({
    queryKey: ['api', 'health'],
    queryFn: fetchApiLiveness,
    enabled: false,
    retry: 0,
  });

  const statusMessage = ((): string | null => {
    if (health.isFetching) {
      return t('common.loading');
    }

    if (health.isError) {
      return t('foundation.apiUnreachable');
    }

    if (health.data) {
      return t('foundation.apiReachable', {
        service: health.data.service,
        version: health.data.version,
      });
    }

    return null;
  })();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { padding: theme.spacing.xl, gap: theme.spacing.md }]}>
        <Text variant="caption" color="secondary">
          {t('foundation.customerApp')}
        </Text>

        <Text variant="h1">{t('foundation.heading')}</Text>

        <Text color="secondary">{t('foundation.body')}</Text>

        <Text variant="caption" color="secondary">
          {t('foundation.apiTarget', { url: apiUrl })}
        </Text>

        <View style={{ marginTop: theme.spacing.xs }}>
          <Button
            label={t('foundation.checkApi')}
            onPress={(): void => {
              void health.refetch();
            }}
            disabled={health.isFetching}
            testID="check-api"
          />
        </View>

        {statusMessage === null ? null : (
          <View
            style={[
              styles.status,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.sm,
                padding: theme.spacing.sm,
              },
            ]}
          >
            {/* Status is conveyed by text, never by colour alone. */}
            <Text variant="secondary" color={health.isError ? 'danger' : 'primary'}>
              {statusMessage}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  status: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
