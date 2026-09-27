import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface GalleryImage {
  url: string;
  altText?: string | null;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  focusedUrl?: string | null;
}

export function ProductGallery({ images, focusedUrl }: ProductGalleryProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(focusedUrl ?? images[0]?.url ?? null);

  useEffect(() => {
    if (focusedUrl && images.some((image) => image.url === focusedUrl)) {
      setSelectedUrl(focusedUrl);
      return;
    }
    if (!selectedUrl || !images.some((image) => image.url === selectedUrl)) {
      setSelectedUrl(images[0]?.url ?? null);
    }
  }, [focusedUrl, images, selectedUrl]);

  const selectedIndex = images.findIndex((image) => image.url === selectedUrl);
  const selectedImage = selectedIndex >= 0 ? images[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <View style={styles.mainImageContainer}>
        {selectedImage ? (
          <Image
            accessibilityLabel={selectedImage.altText ?? 'Ảnh sản phẩm'}
            resizeMode="contain"
            source={{ uri: selectedImage.url }}
            style={styles.mainImage}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons color={colors.textMuted} name="image-outline" size={64} />
            <Text style={styles.placeholderText}>Chưa có ảnh sản phẩm</Text>
          </View>
        )}
        {images.length > 1 ? (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{selectedIndex + 1}/{images.length}</Text>
          </View>
        ) : null}
      </View>

      {images.length > 1 ? (
        <ScrollView
          contentContainerStyle={styles.thumbnailList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {images.map((image, index) => {
            const selected = image.url === selectedUrl;
            return (
              <Pressable
                accessibilityLabel={`Xem ảnh sản phẩm ${index + 1}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={`${image.url}-${index}`}
                onPress={() => setSelectedUrl(image.url)}
                style={({ pressed }) => [
                  styles.thumbnailButton,
                  selected && styles.selectedThumbnail,
                  pressed && styles.pressed,
                ]}
              >
                <Image resizeMode="contain" source={{ uri: image.url }} style={styles.thumbnail} />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface },
  mainImageContainer: {
    height: 330,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  placeholderText: { ...typography.bodySmall, color: colors.textMuted },
  counter: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.overlay,
  },
  counterText: { ...typography.captionSemibold, color: colors.textInverse },
  thumbnailList: { gap: spacing.sm, paddingHorizontal: spacing.screen, paddingBottom: spacing.lg },
  thumbnailButton: {
    width: 64,
    height: 64,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  selectedThumbnail: { borderWidth: 2, borderColor: colors.primary },
  thumbnail: { width: '100%', height: '100%' },
  pressed: { opacity: 0.7 },
});
