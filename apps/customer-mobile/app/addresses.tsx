import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useMutation } from '@tanstack/react-query';
import type { Address, CreateAddressInput } from '@nest/types';
import { createAddress, deleteAddress, updateAddress } from '@/lib/api';
import { useAddress } from '@/lib/address-context';
import { EmptyState, Header, LoadingSkeleton } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const QUICK_LABELS = ['Home', 'Office', 'Apartment', 'Parents', 'Other'];

export default function AddressesScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ returnTo?: string; selectedId?: string }>();
  const {
    addresses,
    selectedAddressId: globalSelectedId,
    selectAddress,
    isLoading,
    isError,
    refetchAddresses,
  } = useAddress();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const activeSelectedId = params.selectedId || globalSelectedId;

  const createMutation = useMutation({
    mutationFn: (input: CreateAddressInput) => createAddress(input),
    onSuccess: async (newAddr) => {
      await selectAddress(newAddr.id);
      await refetchAddresses();
      closeModal();
      if (params.returnTo) {
        router.replace({
          pathname: params.returnTo as never,
          params: { addressId: newAddr.id },
        });
      }
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Could not save address.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAddressInput> }) =>
      updateAddress(id, input),
    onSuccess: async () => {
      await refetchAddresses();
      closeModal();
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Could not update address.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: async () => {
      await refetchAddresses();
    },
    onError: (err) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove address.');
    },
  });

  const openAddModal = (): void => {
    setEditingAddress(null);
    setLabel('Home');
    setAddressLine('');
    setLocality('');
    setCity('');
    setState('');
    setPincode('');
    setInstructions('');
    setFormError(null);
    setModalVisible(true);
  };

  const openEditModal = (addr: Address): void => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setAddressLine(addr.addressLine);
    setLocality(addr.locality);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setInstructions(addr.instructions ?? '');
    setFormError(null);
    setModalVisible(true);
  };

  const closeModal = (): void => {
    setModalVisible(false);
    setEditingAddress(null);
    setFormError(null);
  };

  const handleSave = (): void => {
    Keyboard.dismiss();
    const trimmedLine = addressLine.trim();
    const trimmedLocality = locality.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedPincode = pincode.trim();

    if (!trimmedLine) {
      setFormError('Please enter your house/flat number and building name.');
      return;
    }
    if (!trimmedLocality) {
      setFormError('Please enter your area or locality.');
      return;
    }
    if (!trimmedCity) {
      setFormError('Please enter your city.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedPincode)) {
      setFormError('Please enter a valid 6-digit Indian pincode.');
      return;
    }

    setFormError(null);

    const payload: CreateAddressInput = {
      label: label.trim() || 'Home',
      addressLine: trimmedLine,
      locality: trimmedLocality,
      city: trimmedCity,
      state: trimmedState || 'Karnataka',
      pincode: trimmedPincode,
      instructions: instructions.trim() || null,
    };

    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, input: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (addr: Address): void => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to remove "${addr.label}" from your saved locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(addr.id),
        },
      ],
    );
  };

  const handleSelect = async (addrId: string): Promise<void> => {
    await selectAddress(addrId);
    if (params.returnTo) {
      router.replace({
        pathname: params.returnTo as never,
        params: { addressId: addrId },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header
          caption="Service Locations"
          title="Saved Addresses"
          subtitle="Manage your home, office, and family addresses for fast technician dispatch."
          rightAction={
            <Pressable
              style={styles.addIconBtn}
              onPress={openAddModal}
              accessibilityRole="button"
              accessibilityLabel="Add new address"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          }
        />

        {/* Loading State */}
        {isLoading && <LoadingSkeleton height={110} count={3} />}

        {/* Error State */}
        {isError && !isLoading && (
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to load addresses"
            subtitle="Please check your network connection and try again."
            actionLabel="Retry"
            onAction={() => void refetchAddresses()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && addresses.length === 0 && (
          <EmptyState
            icon="location-outline"
            title="No addresses saved yet"
            subtitle="Add your primary home or office address to book local specialists with one tap."
            actionLabel="+ Add New Address"
            onAction={openAddModal}
          />
        )}

        {/* Address Cards List */}
        {!isLoading && addresses.length > 0 && (
          <View style={styles.list}>
            {addresses.map((addr) => {
              const isSelected = addr.id === activeSelectedId;

              return (
                <Pressable
                  key={addr.id}
                  style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                  onPress={() => void handleSelect(addr.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select address: ${addr.label}, ${addr.addressLine}`}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.labelRow}>
                      <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                        <Ionicons
                          name={
                            addr.label.toLowerCase().includes('office')
                              ? 'briefcase-outline'
                              : 'home-outline'
                          }
                          size={18}
                          color={isSelected ? '#FFFFFF' : colors.primary}
                        />
                      </View>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text variant="bodyStrong" style={styles.addrLabel}>
                            {addr.label}
                          </Text>
                          {isSelected ? (
                            <View style={styles.selectedBadge}>
                              <Ionicons name="checkmark" size={10} color={colors.primary} />
                              <Text style={styles.selectedBadgeText}>SELECTED</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text variant="caption" color="secondary">
                          {addr.locality}, {addr.city}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionsRow}>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => openEditModal(addr)}
                        hitSlop={8}
                        accessibilityLabel={`Edit ${addr.label}`}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        style={styles.actionBtn}
                        onPress={() => handleDelete(addr)}
                        hitSlop={8}
                        accessibilityLabel={`Delete ${addr.label}`}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>

                  <Text variant="body" style={styles.addressLineText}>
                    {addr.addressLine}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                  </Text>

                  {addr.instructions ? (
                    <View style={styles.instructionsBox}>
                      <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
                      <Text variant="caption" style={styles.instructionsText}>
                        {addr.instructions}
                      </Text>
                    </View>
                  ) : null}

                  {/* Quick Select Button */}
                  <View style={styles.cardFooter}>
                    <Pressable
                      style={[
                        styles.selectBtn,
                        isSelected && styles.selectBtnActive,
                      ]}
                      onPress={() => void handleSelect(addr.id)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                        size={16}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        variant="caption"
                        style={[
                          styles.selectBtnText,
                          isSelected && styles.selectBtnTextActive,
                        ]}
                      >
                        {isSelected ? 'Current Selected Address' : 'Use this address'}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            <Button
              label="+ Add Another Address"
              variant="secondary"
              onPress={openAddModal}
            />
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Address Modal Sheet */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text variant="h2" style={styles.modalTitle}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>
                <Text variant="caption" color="secondary">
                  Enter complete doorstep details for technician dispatch
                </Text>
              </View>
              <Pressable
                onPress={closeModal}
                style={styles.closeBtn}
                hitSlop={8}
                accessibilityLabel="Close form"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {formError ? (
              <View style={styles.formErrorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text variant="caption" style={{ color: colors.danger, flex: 1 }}>
                  {formError}
                </Text>
              </View>
            ) : null}

            <ScrollView
              style={styles.modalForm}
              contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Label Selector */}
              <View style={styles.formGroup}>
                <Text variant="caption" style={styles.inputLabel}>
                  ADDRESS TYPE / LABEL
                </Text>
                <View style={styles.quickLabelsRow}>
                  {QUICK_LABELS.map((item) => {
                    const isSelected = label === item;
                    return (
                      <Pressable
                        key={item}
                        style={[styles.labelChip, isSelected && styles.labelChipActive]}
                        onPress={() => setLabel(item)}
                      >
                        <Text
                          variant="caption"
                          style={[styles.labelChipText, isSelected && styles.labelChipTextActive]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* House / Flat / Street */}
              <View style={styles.formGroup}>
                <Text variant="caption" style={styles.inputLabel}>
                  HOUSE / FLAT / BUILDING *
                </Text>
                <TextInput
                  value={addressLine}
                  onChangeText={setAddressLine}
                  placeholder="e.g. Flat B-204, 3rd Floor, Sunrise Heights"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              {/* Locality & Area */}
              <View style={styles.formGroup}>
                <Text variant="caption" style={styles.inputLabel}>
                  LOCALITY / AREA / STREET *
                </Text>
                <TextInput
                  value={locality}
                  onChangeText={setLocality}
                  placeholder="e.g. Sadashiv Nagar, Tilakwadi, Camp"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              {/* City & Pincode Row */}
              <View style={styles.twoColRow}>
                <View style={[styles.formGroup, { flex: 1.2 }]}>
                  <Text variant="caption" style={styles.inputLabel}>
                    CITY *
                  </Text>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Belagavi"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 0.8 }]}>
                  <Text variant="caption" style={styles.inputLabel}>
                    PINCODE *
                  </Text>
                  <TextInput
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="590001"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* State */}
              <View style={styles.formGroup}>
                <Text variant="caption" style={styles.inputLabel}>
                  STATE
                </Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="Karnataka"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              {/* Delivery / Arrival Instructions */}
              <View style={styles.formGroup}>
                <Text variant="caption" style={styles.inputLabel}>
                  ARRIVAL GUIDANCE (OPTIONAL)
                </Text>
                <TextInput
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder="e.g. Landmark near water tank, ring bell twice"
                  placeholderTextColor={colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={{ marginTop: spacing.sm }}>
                <Button
                  label={isSaving ? 'Saving address…' : editingAddress ? 'Update Address' : 'Save Address'}
                  onPress={handleSave}
                  disabled={isSaving}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: spacing.md,
  },
  addressCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAF5FF',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.primary,
  },
  addrLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  selectedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressLineText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  instructionsText: {
    fontSize: 12,
    color: colors.primaryDark,
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  selectBtnActive: {},
  selectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  modalForm: {
    maxHeight: 480,
  },
  formGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  quickLabelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  labelChip: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  labelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelChipTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
