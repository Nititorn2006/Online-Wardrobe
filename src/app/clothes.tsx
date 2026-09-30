import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Layout, Palette, Radius } from '@/constants/design';
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  type ClothingCategory,
  type ClothingFormality,
} from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

export default function ClothingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    items,
    toggleFavorite,
    deleteItem,
    updateItemClassification,
  } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [isEditingClassification, setIsEditingClassification] = useState(false);
  const [isSavingClassification, setIsSavingClassification] = useState(false);
  const [draftCategory, setDraftCategory] = useState<ClothingCategory>('tops');
  const [draftFormality, setDraftFormality] = useState<ClothingFormality>('casual');
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.missingSafeArea}>
          <View style={styles.missingMark}>
            <AppText style={styles.missingMarkText}>✓</AppText>
          </View>
          <AppText style={styles.missingTitle}>This piece is no longer here</AppText>
          <AppText style={styles.missingBody}>
            It may have already been removed from your wardrobe.
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AppText style={styles.primaryButtonText}>Back to my clothes</AppText>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const categoryLabel = CATEGORIES.find((category) => category.value === item.category)?.label;
  const formalityLabel = FORMALITY_LEVELS.find(
    (level) => level.value === item.formality,
  )?.label;
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

  const startEditingClassification = () => {
    setDraftCategory(item.category);
    setDraftFormality(item.formality);
    setIsEditingClassification(true);
  };

  const saveClassification = async () => {
    setIsSavingClassification(true);

    try {
      await updateItemClassification(item.id, {
        category: draftCategory,
        formality: draftFormality,
      });
      setIsEditingClassification(false);
    } catch (error) {
      Alert.alert('Couldn’t update classification', getErrorMessage(error));
    } finally {
      setIsSavingClassification(false);
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
            <AppText style={styles.closeIcon}>×</AppText>
          </Pressable>
          <AppText style={styles.topBarTitle}>Clothing details</AppText>
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
              <AppText style={[styles.heart, item.isFavorite && styles.heartSelected]}>
                {item.isFavorite ? '♥' : '♡'}
              </AppText>
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
                <AppText style={styles.category}>{categoryLabel}</AppText>
                <AppText style={styles.name}>{item.name}</AppText>
              </View>
              <View accessibilityLabel={`Color ${item.color}`} style={styles.colorBadge}>
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
              </View>
            </View>

            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Category</AppText>
                <AppText style={styles.metaValue}>{categoryLabel}</AppText>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Dress code</AppText>
                <AppText style={styles.metaValue}>{formalityLabel}</AppText>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Added</AppText>
                <AppText style={styles.metaValue}>{createdDate}</AppText>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>Favorite</AppText>
                <AppText style={styles.metaValue}>{item.isFavorite ? 'Yes' : 'Not yet'}</AppText>
              </View>
            </View>

            {isEditingClassification ? (
              <View style={styles.classificationEditor}>
                <View style={styles.editorGroup}>
                  <AppText style={styles.editorLabel}>Category</AppText>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map((option) => (
                      <ClassificationChip
                        isSelected={draftCategory === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => setDraftCategory(option.value)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.editorGroup}>
                  <AppText style={styles.editorLabel}>Dress code</AppText>
                  <View style={styles.chipRow}>
                    {FORMALITY_LEVELS.map((option) => (
                      <ClassificationChip
                        isSelected={draftFormality === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => setDraftFormality(option.value)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.editorActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSavingClassification}
                    onPress={() => setIsEditingClassification(false)}
                    style={({ pressed }) => [
                      styles.editorButton,
                      styles.editorCancelButton,
                      pressed && styles.pressed,
                    ]}>
                    <AppText style={styles.editorCancelText}>Cancel</AppText>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: isSavingClassification }}
                    disabled={isSavingClassification}
                    onPress={() => void saveClassification()}
                    style={({ pressed }) => [
                      styles.editorButton,
                      styles.editorSaveButton,
                      pressed && styles.pressed,
                    ]}>
                    {isSavingClassification ? (
                      <ActivityIndicator color={Palette.white} size="small" />
                    ) : (
                      <AppText style={styles.editorSaveText}>Save changes</AppText>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={startEditingClassification}
                style={({ pressed }) => [
                  styles.classificationButton,
                  pressed && styles.pressed,
                ]}>
                <AppText style={styles.classificationButtonText}>
                  Edit category &amp; dress code
                </AppText>
              </Pressable>
            )}

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
              <AppText
                style={[
                  styles.favoriteButtonIcon,
                  item.isFavorite && styles.favoriteButtonTextSelected,
                ]}>
                {item.isFavorite ? '♥' : '♡'}
              </AppText>
              <AppText
                style={[
                  styles.favoriteButtonText,
                  item.isFavorite && styles.favoriteButtonTextSelected,
                ]}>
                {item.isFavorite ? 'Saved to favorites' : 'Add to favorites'}
              </AppText>
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
                <AppText style={styles.deleteIcon}>⌫</AppText>
                <AppText style={styles.deleteText}>Remove from closet</AppText>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ClassificationChip({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.classificationChip,
        isSelected && styles.classificationChipSelected,
        pressed && styles.pressed,
      ]}>
      <AppText
        style={[
          styles.classificationChipText,
          isSelected && styles.classificationChipTextSelected,
        ]}>
        {label}
      </AppText>
    </Pressable>
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
  classificationButton: {
    minHeight: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brand,
  },
  classificationButtonText: { color: Palette.brand, fontSize: 14, fontWeight: '700' },
  classificationEditor: {
    gap: 18,
    padding: 16,
    borderRadius: Radius.medium,
    backgroundColor: Palette.brandSoft,
  },
  editorGroup: { gap: 9 },
  editorLabel: { color: Palette.ink, fontSize: 13, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classificationChip: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  classificationChipSelected: {
    backgroundColor: Palette.brand,
    borderColor: Palette.brand,
  },
  classificationChipText: { color: Palette.ink, fontSize: 12, fontWeight: '600' },
  classificationChipTextSelected: { color: Palette.white },
  editorActions: { flexDirection: 'row', gap: 8 },
  editorButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorCancelButton: { backgroundColor: Palette.surface },
  editorSaveButton: { backgroundColor: Palette.brand },
  editorCancelText: { color: Palette.ink, fontSize: 13, fontWeight: '700' },
  editorSaveText: { color: Palette.white, fontSize: 13, fontWeight: '700' },
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
