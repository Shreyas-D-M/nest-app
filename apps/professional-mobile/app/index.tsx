import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTranslator } from '@nest/i18n';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

const t = createTranslator('en');

const queue = [
  { name: 'Priya M.', service: 'Water purifier', time: 'Starts in 25 min', priority: 'High' },
  { name: 'Harish C.', service: 'AC check', time: 'Starts in 1 hr', priority: 'Normal' },
  { name: 'Mohana A.', service: 'Leak repair', time: 'Starts today', priority: 'High' },
];

export default function ProfessionalHomeScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text variant="caption" color="secondary">
              {t('professional.home.online')}
            </Text>
            <Text variant="h1">{t('professional.home.title')}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: theme.colors.success }]}>
            <Text variant="secondary" color="inverse">
              Online
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="caption" color="secondary">
            {t('professional.home.nextJob')}
          </Text>
          <Text variant="h2" style={{ marginTop: 4 }}>
            AC not cooling
          </Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
            {t('professional.home.jobAddress')}
          </Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
            {t('professional.home.jobTime')}
          </Text>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label={t('professional.home.accept')} onPress={() => undefined} />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Text variant="caption" color="secondary">
              {t('professional.home.jobsToday')}
            </Text>
            <Text variant="h2">08</Text>
          </View>
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Text variant="caption" color="secondary">
              {t('professional.home.earnings')}
            </Text>
            <Text variant="h2">{t('professional.home.earningsValue')}</Text>
          </View>
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Text variant="caption" color="secondary">
              {t('professional.home.responseRate')}
            </Text>
            <Text variant="h2">{t('professional.home.responseValue')}</Text>
          </View>
        </View>

        <View>
          <Text variant="h2" style={{ marginBottom: 12 }}>
            {t('professional.home.queue')}
          </Text>
          <View style={styles.stack}>
            {queue.map((job) => (
              <View
                key={job.name}
                style={[
                  styles.jobRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{job.name}</Text>
                  <Text variant="secondary" color="secondary">
                    {job.service} · {job.time}
                  </Text>
                </View>
                <View
                  style={[
                    styles.priorityPill,
                    {
                      backgroundColor:
                        job.priority === 'High' ? theme.colors.warning : theme.colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text variant="secondary" color={job.priority === 'High' ? 'warning' : 'primary'}>
                    {job.priority}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  card: {
    borderWidth: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  stack: {
    gap: 12,
  },
  jobRow: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  priorityPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
