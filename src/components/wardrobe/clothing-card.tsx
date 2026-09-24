import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClothingItem } from '@/features/wardrobe/types';

const CATEGORY_LABELS: Record<ClothingItem['category'], string> = {
  tops: 'Top',
  bottoms: 'Bottom',
  dresses: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessory',
};

export type ClothingCardProps = {
  item: ClothingItem;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export function ClothingCard({ item, onPress, onToggleFavorite }: ClothingCardProps) {
  const favoriteLabel = item.isFavorite
    ? `Remove ${item.name} from favorites`
    : `Add ${item.name} to favorites`;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityHint="Opens clothing details"
        accessibilityLabel={item.name}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.cardContent, pressed && styles.pressed]}>
        <View style={styles.imageFrame}>
          <Image
            accessibilityLabel={`Photo of ${item.name}`}
            contentFit="cover"
            source={{ uri: item.imageUri }}
            style={styles.image}
            transition={180}
          />
        </View>

        <View style={styles.details}>
          <Text numberOfLines={1} style={styles.name}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <View accessibilityLabel={`Color: ${item.color}`} style={styles.colorDotWrap}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            </View>
            <Text numberOfLines={1} style={styles.category}>
              {CATEGORY_LABELS[item.category]}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={favoriteLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: item.isFavorite }}
        hitSlop={4}
        onPress={onToggleFavorite}
        style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoritePressed]}>
        <Text
          importantForAccessibility="no"
          style={[styles.heart, item.isFavorite && styles.heartSelected]}>
          {item.isFavorite ? '\u2665' : '\u2661'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderCurve: 'continuous',
    ...Platform.select({
      web: { boxShadow: '0 8px 18px rgba(23, 52, 50, 0.08)' },
      default: {
        shadowColor: '#173432',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 3,
      },
    }),
  },
  cardContent: {
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#EEEAE3',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  details: {
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 12,
  },
  name: {
    color: '#173432',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  colorDotWrap: {
    alignItems: 'center',
    borderColor: '#D8D2C8',
    borderRadius: 6,
    borderWidth: 1,
    height: 12,
    justifyContent: 'center',
    width: 12,
  },
  colorDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  category: {
    color: '#6D7774',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 44,
    zIndex: 1,
  },
  favoritePressed: {
    backgroundColor: '#FFF0EE',
    transform: [{ scale: 0.92 }],
  },
  heart: {
    color: '#0B6B69',
    fontSize: 25,
    fontWeight: '600',
    lineHeight: 27,
  },
  heartSelected: {
    color: '#EF6A67',
  },
});
