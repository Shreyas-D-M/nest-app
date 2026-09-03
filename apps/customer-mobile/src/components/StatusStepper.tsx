import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import { colors, spacing } from '../theme/colors';

export interface StepItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface StatusStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  orientation?: 'horizontal' | 'vertical';
}

export function StatusStepper({
  steps,
  currentStepIndex,
  orientation = 'horizontal',
}: StatusStepperProps): ReactElement {
  if (orientation === 'vertical') {
    return (
      <View style={styles.verticalContainer}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isLast = idx === steps.length - 1;

          return (
            <View key={step.id}>
              <View style={styles.verticalRow}>
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.circleDone,
                    isActive && styles.circleActive,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name={step.icon ?? 'ellipse'}
                      size={13}
                      color={isActive ? '#FFFFFF' : colors.textMuted}
                    />
                  )}
                </View>

                <View style={styles.verticalTextWrap}>
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.stepTitle,
                      isActive && styles.stepTitleActive,
                      isDone && styles.stepTitleDone,
                    ]}
                  >
                    {step.title}
                  </Text>
                  {step.subtitle ? (
                    <Text variant="caption" color="secondary">
                      {step.subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>

              {!isLast ? (
                <View
                  style={[
                    styles.verticalLine,
                    isDone ? styles.lineDone : styles.linePending,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.horizontalContainer}>
      <View style={styles.horizontalBarRow}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isLast = idx === steps.length - 1;

          return (
            <View
              key={step.id}
              style={[
                styles.horizontalNodeWrap,
                !isLast && styles.horizontalNodeWithConnector,
              ]}
            >
              <View
                style={[
                  styles.stepCircle,
                  isDone && styles.circleDone,
                  isActive && styles.circleActive,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={step.icon ?? 'ellipse'}
                    size={11}
                    color={isActive ? '#FFFFFF' : colors.textMuted}
                  />
                )}
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.horizontalConnector,
                    isDone ? styles.lineDone : styles.linePending,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.horizontalLabelsRow}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          return (
            <View key={`label-${step.id}`} style={styles.horizontalLabelCol}>
              <Text
                variant="caption"
                style={[
                  styles.horizontalStepText,
                  isActive && styles.stepTitleActive,
                  isDone && styles.stepTitleDone,
                ]}
                numberOfLines={2}
              >
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalContainer: {
    gap: 0,
  },
  verticalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  verticalTextWrap: {
    flex: 1,
    gap: 2,
  },
  verticalLine: {
    width: 2,
    height: 18,
    marginLeft: 13,
    marginVertical: 2,
  },
  horizontalContainer: {
    width: '100%',
    gap: 6,
  },
  horizontalBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  horizontalNodeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalNodeWithConnector: {
    flex: 1,
  },
  horizontalConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  horizontalLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  horizontalLabelCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  horizontalStepText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleDone: {
    backgroundColor: colors.success,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  stepTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stepTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepTitleDone: {
    color: colors.successText,
    fontWeight: '600',
  },
  lineDone: {
    backgroundColor: colors.success,
  },
  linePending: {
    backgroundColor: colors.border,
  },
});
