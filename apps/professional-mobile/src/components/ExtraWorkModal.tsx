import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useState, type ReactElement } from 'react';
import { colors, radius, shadows, spacing } from '../theme/colors';

export interface ExtraWorkModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; amountMinor: number }) => void;
  isLoading?: boolean;
}

export function ExtraWorkModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: ExtraWorkModalProps): ReactElement {
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');

  const handleSubmit = () => {
    const rupees = Number(amountRupees.trim());
    if (!description.trim()) {
      return;
    }
    if (isNaN(rupees) || rupees <= 0) {
      return;
    }

    onSubmit({
      description: description.trim(),
      amountMinor: Math.round(rupees * 100),
    });
    setDescription('');
    setAmountRupees('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <View style={styles.titleWrap}>
              <View style={styles.iconCircle}>
                <Ionicons name="add-circle" size={20} color={colors.primary} />
              </View>
              <Text variant="h2" style={styles.sheetTitle}>
                Propose Extra Work
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text variant="body" style={styles.sheetSubtitle}>
            If additional repairs or replacement spare parts are needed, submit a quote for customer approval.
          </Text>

          {/* Form */}
          <View style={styles.formGroup}>
            <Text variant="caption" style={styles.fieldLabel}>
              Description of Additional Work / Spare Parts
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Copper coil brazing and capacitor replacement"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text variant="caption" style={styles.fieldLabel}>
              Additional Amount (₹)
            </Text>
            <View style={styles.currencyInputWrap}>
              <Text variant="bodyStrong" style={styles.currencySymbol}>
                ₹
              </Text>
              <TextInput
                style={styles.currencyInput}
                placeholder="499"
                placeholderTextColor={colors.textMuted}
                value={amountRupees}
                onChangeText={setAmountRupees}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.actionWrap}>
            <Button
              label={isLoading ? 'Submitting…' : 'Send Quote to Customer →'}
              onPress={handleSubmit}
              disabled={isLoading || !description.trim() || !amountRupees.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  currencySymbol: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 6,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
