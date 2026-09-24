import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Layout, Palette, Radius } from '@/constants/design';
import { CATEGORIES } from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

export default function ClothingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { items, toggleFavorite, deleteItem } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.missingSafeArea}>
          <View style={styles.missingMark}>
            <Text style={styles.missingMarkText}>✓</Text>
          </View>
          <Text style={styles.missingTitle}>This piece is no longer here</Text>
          <Text style={styles.missingBody}>
            It may have already been removed from your wardrobe.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Back to my clothes</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const categoryLabel = CATEGORIES.find((category) => category.value === item.category)?.label;
  const createdDate = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(item.createdAt));

  const handleFavorite = async () => {
    setIsUpdatingFavorite(true);
    try {
      await toggleFavorite(item.id);
    } catch (error) {
      Alert.alert('Couldn’t update favorite', getErrorMessage(error));
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      `Remove ${item.name}?`,
      'This will delete the piece and its saved photo from your closet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void handleDelete(),
        },
      ],
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteItem(item.id);
      router.back();
    } catch (error) {
      setIsDeleting(false);
      Alert.alert('Couldn’t remove item', getErrorMessage(error));
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close clothing details"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Clothing details</Text>
          <Pressable
            accessibilityLabel={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityRole="button"
            accessibilityState={{ selected: item.isFavorite, busy: isUpdatingFavorite }}
            disabled={isUpdatingFavorite}
            hitSlop={8}
            onPress={() => void handleFavorite()}
            style={({ pressed }) => [
              styles.roundButton,
              item.isFavorite && styles.favoriteRoundButton,
              pressed && styles.pressed,
            ]}>
            {isUpdatingFavorite ? (
              <ActivityIndicator color={Palette.coral} size="small" />
            ) : (
              <Text style={[styles.heart, item.isFavorite && styles.heartSelected]}>
                {item.isFavorite ? '♥' : '♡'}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageCard}>
            <Image
              accessibilityLabel={`Photo of ${item.name}`}
              contentFit="cover"
              source={{ uri: item.imageUri }}
              style={styles.image}
              transition={180}
            />
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.titleRow}>
              <View style={styles.detailTitleCopy}>
                <Text style={styles.category}>{categoryLabel}</Text>
                <Text style={styles.name}>{item.name}</Text>
              </View>
              <View accessibilityLabel={`Color ${item.color}`} style={styles.colorBadge}>
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
              </View>
            </View>

            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{categoryLabel}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Added</Text>
                <Text style={styles.metaValue}>{createdDate}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Favorite</Text>
                <Text style={styles.metaValue}>{item.isFavorite ? 'Yes' : 'Not yet'}</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: item.isFavorite }}
              disabled={isUpdatingFavorite}
              onPress={() => void handleFavorite()}
              style={({ pressed }) => [
                styles.favoriteButton,
                item.isFavorite && styles.favoriteButtonSelected,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.favoriteButtonIcon,
                  item.isFavorite && styles.favoriteButtonTextSelected,
                ]}>
                {item.isFavorite ? '♥' : '♡'}
              </Text>
              <Text
                style={[
                  styles.favoriteButtonText,
                  item.isFavorite && styles.favoriteButtonTextSelected,
                ]}>
                {item.isFavorite ? 'Saved to favorites' : 'Add to favorites'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isDeleting, disabled: isDeleting }}
            disabled={isDeleting}
            onPress={confirmDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deletePressed]}>
            {isDeleting ? (
              <ActivityIndicator color={Palette.danger} />
            ) : (
              <>
                <Text style={styles.deleteIcon}>⌫</Text>
                <Text style={styles.deleteText}>Remove from closet</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },
  topBar: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.gutter,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: { color: Palette.ink, fontSize: 15, fontWeight: '700' },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  favoriteRoundButton: { backgroundColor: Palette.coralSoft, borderColor: Palette.coralSoft },
  closeIcon: { color: Palette.ink, fontSize: 27, lineHeight: 28, fontWeight: '300' },
  heart: { color: Palette.brand, fontSize: 26, lineHeight: 27 },
  heartSelected: { color: Palette.coral },
  scrollContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: Layout.gutter,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 0.86,
    maxHeight: 580,
    borderRadius: Radius.large,
    overflow: 'hidden',
    backgroundColor: Palette.lavender,
  },
  image: { width: '100%', height: '100%' },
  detailsCard: {
    padding: 20,
    gap: 22,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  detailTitleCopy: { flex: 1, gap: 3 },
  category: {
    color: Palette.brand,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  name: { color: Palette.ink, fontSize: 29, lineHeight: 35, fontWeight: '700', letterSpacing: -0.8 },
  colorBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
  metaList: {
    borderRadius: Radius.medium,
    backgroundColor: Palette.background,
    paddingHorizontal: 16,
  },
  metaRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaDivider: { height: 1, backgroundColor: Palette.border },
  metaLabel: { color: Palette.muted, fontSize: 13 },
  metaValue: { color: Palette.ink, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  favoriteButton: {
    minHeight: 52,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: Palette.brandSoft,
  },
  favoriteButtonSelected: { backgroundColor: Palette.coralSoft },
  favoriteButtonIcon: { color: Palette.brand, fontSize: 23, lineHeight: 24 },
  favoriteButtonText: { color: Palette.brand, fontSize: 15, fontWeight: '700' },
  favoriteButtonTextSelected: { color: Palette.coral },
  deleteButton: {
    minHeight: 52,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: '#F1C8C7',
  },
  deletePressed: { backgroundColor: Palette.coralSoft },
  deleteIcon: { color: Palette.danger, fontSize: 20 },
  deleteText: { color: Palette.danger, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  missingSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  missingMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  missingMarkText: { color: Palette.brand, fontSize: 30, fontWeight: '700' },
  missingTitle: { color: Palette.ink, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  missingBody: { color: Palette.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: {
    minHeight: 50,
    marginTop: 8,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: Palette.white, fontSize: 15, fontWeight: '700' },
});
