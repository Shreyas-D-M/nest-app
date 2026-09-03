import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface PhotoAttachmentGridProps {
  photos: string[];
  maxPhotos?: number;
  onAddPhoto: (uri: string) => void;
  onRemovePhoto: (index: number) => void;
  title?: string;
  subtitle?: string;
}

export function PhotoAttachmentGrid({
  photos,
  maxPhotos = 3,
  onAddPhoto,
  onRemovePhoto,
  title = 'Add photos (optional)',
  subtitle = 'Photos help professionals understand the problem.',
}: PhotoAttachmentGridProps): ReactElement {
  const handleLaunchCamera = async (): Promise<void> => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo limit reached', `You can attach up to ${maxPhotos} photos per request.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please enable camera access in device settings to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;
      onAddPhoto(result.assets[0].uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to capture photo.';
      Alert.alert('Camera Error', msg);
    }
  };

  const handleLaunchLibrary = async (): Promise<void> => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Photo limit reached', `You can attach up to ${maxPhotos} photos per request.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please enable photo library access in device settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;
      onAddPhoto(result.assets[0].uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to select photo.';
      Alert.alert('Library Error', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text variant="h2" style={styles.title}>
            {title}
          </Text>
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        </View>
        <Text variant="caption" style={styles.counter}>
          {photos.length}/{maxPhotos}
        </Text>
      </View>

      <View style={styles.galleryRow}>
        {photos.map((uri, index) => (
          <View key={uri} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumbImage} />
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>#{index + 1}</Text>
            </View>
            <Pressable
              style={styles.removeBtn}
              onPress={() => onRemovePhoto(index)}
              hitSlop={8}
              accessibilityLabel={`Remove photo ${index + 1}`}
            >
              <Ionicons name="close" size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}

        {photos.length < maxPhotos ? (
          <View style={styles.addButtonsGroup}>
            <Pressable
              style={styles.addCard}
              onPress={() => void handleLaunchCamera()}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera"
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text variant="caption" style={styles.addText}>
                Camera
              </Text>
            </Pressable>

            <Pressable
              style={styles.addCard}
              onPress={() => void handleLaunchLibrary()}
              accessibilityRole="button"
              accessibilityLabel="Choose from photo library"
            >
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text variant="caption" style={styles.addText}>
                Gallery
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  counter: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  thumbWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  indexBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  indexBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonsGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addCard: {
    width: 80,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});
