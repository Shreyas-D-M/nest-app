import { Link, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { getServices } from '@/lib/api';
import { classifyProblem } from '@/lib/problem-classifier';

export default function ProblemAssistantScreen(): ReactElement {
  const theme = useTheme();
  const { issue } = useLocalSearchParams<{ issue?: string }>();
  const { data, isLoading, error } = useQuery({ queryKey: ['catalog'], queryFn: getServices });

  const problem = useMemo(() => classifyProblem(issue ?? '', data ?? null), [issue, data]);

  const categories = useMemo(() => {
    const matches = (data?.categories ?? []).flatMap((category) =>
      category.services
        .filter((service) => {
          if (problem.categoryName && problem.serviceNames.length > 0) {
            return (
              category.name.toLowerCase().includes(problem.categoryName.toLowerCase()) ||
              problem.serviceNames.some((serviceName) =>
                service.name.toLowerCase().includes(serviceName.toLowerCase()) ||
                serviceName.toLowerCase().includes(service.name.toLowerCase())
              )
            );
          }
          return true;
        })
        .map((service) => ({
          id: service.id,
          name: service.name,
          description: category.name,
        })),
    );

    return matches.length > 0 ? matches.slice(0, 6) : (data?.categories ?? []).flatMap((category) =>
      category.services.slice(0, 2).map((service) => ({
        id: service.id,
        name: service.name,
        description: category.name,
      })),
    );
  }, [data, problem.categoryName, problem.serviceNames]);

  const handleFindMatches = (): void => {
    router.push({
      pathname: '/professionals',
      params: { issue: issue ?? '', category: problem.categoryName },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <View style={styles.topRow}>
          <Link href="/" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Problem assistant
          </Text>
        </View>

        <Text variant="h1">Tell us what happened</Text>

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
          <Text color="secondary">{issue ?? 'No issue details provided.'}</Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <Text variant="bodyStrong" style={{ marginBottom: 6 }}>
              We understand: {problem.summary}
            </Text>
            <Text color="secondary">
              {problem.serviceNames.length > 0
                ? `Likely service: ${problem.serviceNames.join(', ')}`
                : 'We are narrowing the right specialist for you.'}
            </Text>
          </View>
        </View>

        <View>
          <Text variant="h2" style={{ marginBottom: 12 }}>
            Suggested categories
          </Text>
          <View style={styles.categoryGrid}>
            {isLoading && (
              <Text variant="secondary" color="secondary">
                Loading likely service matches…
              </Text>
            )}
            {error && (
              <Text variant="secondary" color="secondary">
                Unable to load service matches right now.
              </Text>
            )}
            {!isLoading && !error && categories.length === 0 && (
              <Text variant="secondary" color="secondary">
                No services are available right now. Please try again shortly.
              </Text>
            )}
            {categories.map((category) => (
              <View
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Text variant="bodyStrong">{category.name}</Text>
                <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                  {category.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label="Find matching professionals"
            onPress={handleFindMatches}
          />
          <Button label="Edit issue" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
  inputBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  categoryGrid: { gap: 12 },
  categoryCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
});
