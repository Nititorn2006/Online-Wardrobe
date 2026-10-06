import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, AppTextInput } from '@/components/app-text';
import { ClothingColorPicker } from '@/components/wardrobe/clothing-color-picker';
import { Layout, Palette, Radius } from '@/constants/design';
import { DEFAULT_CLOTHING_COLOR } from '@/features/wardrobe/color-palette';
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  type ClothingCategory,
  type ClothingFormality,
} from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';
import { getLocalizedErrorMessage } from '@/i18n';

export default function ClothingDetailScreen() {
  const { i18n, t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    items,
    toggleFavorite,
    deleteItem,
    updateItemDetails,
  } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState<ClothingCategory>('tops');
  const [draftFormality, setDraftFormality] = useState<ClothingFormality>('casual');
  const [draftColor, setDraftColor] = useState<string>(DEFAULT_CLOTHING_COLOR);
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.missingSafeArea}>
          <View style={styles.missingMark}>
            <AppText style={styles.missingMarkText}>✓</AppText>
          </View>
          <AppText style={styles.missingTitle}>
            {t('clothingDetails.missing.title')}
          </AppText>
          <AppText style={styles.missingBody}>
            {t('clothingDetails.missing.body')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <AppText style={styles.primaryButtonText}>
              {t('clothingDetails.missing.back')}
            </AppText>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const categoryOption = CATEGORIES.find((category) => category.value === item.category);
  const formalityOption = FORMALITY_LEVELS.find(
    (level) => level.value === item.formality,
  );
  const categoryLabel = categoryOption
    ? t(`options.categories.${categoryOption.value}`)
    : undefined;
  const formalityLabel = formalityOption
    ? t(`options.formalities.${formalityOption.value}.label`)
    : undefined;
  const dateLocale = i18n.resolvedLanguage === 'th' ? 'th-TH' : 'en-US';
  const createdDate = new Intl.DateTimeFormat(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(item.createdAt));

  const handleFavorite = async () => {
    setIsUpdatingFavorite(true);
    try {
      await toggleFavorite(item.id);
    } catch (error) {
      Alert.alert(
        t('clothingDetails.errors.favoriteTitle'),
        getLocalizedErrorMessage(error, t('common.tryAgain')),
      );
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const startEditingDetails = () => {
    setDraftName(item.name);
    setDraftCategory(item.category);
    setDraftFormality(item.formality);
    setDraftColor(item.color);
    setIsEditingDetails(true);
  };

  const saveDetails = async () => {
    setIsSavingDetails(true);

    try {
      await updateItemDetails(item.id, {
        name: draftName,
        category: draftCategory,
        formality: draftFormality,
        color: draftColor,
      });
      setIsEditingDetails(false);
    } catch (error) {
      Alert.alert(
        t('clothingDetails.errors.updateTitle'),
        getLocalizedErrorMessage(error, t('common.tryAgain')),
      );
    } finally {
      setIsSavingDetails(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      t('clothingDetails.deleteConfirmation.title', { name: item.name }),
      t('clothingDetails.deleteConfirmation.body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('clothingDetails.deleteConfirmation.confirm'),
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
      Alert.alert(
        t('clothingDetails.errors.deleteTitle'),
        getLocalizedErrorMessage(error, t('common.tryAgain')),
      );
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={t('clothingDetails.accessibility.close')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
            <AppText style={styles.closeIcon}>×</AppText>
          </Pressable>
          <AppText style={styles.topBarTitle}>
            {t('clothingDetails.title')}
          </AppText>
          <Pressable
            accessibilityLabel={
              item.isFavorite
                ? t('clothingDetails.accessibility.removeFavorite')
                : t('clothingDetails.accessibility.addFavorite')
            }
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
              accessibilityLabel={t('clothingDetails.accessibility.photo', {
                name: item.name,
              })}
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
              <View
                accessibilityLabel={t('common.color', { color: item.color })}
                style={styles.colorBadge}>
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
              </View>
            </View>

            <View style={styles.metaList}>
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>
                  {t('clothingDetails.category')}
                </AppText>
                <AppText style={styles.metaValue}>{categoryLabel}</AppText>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>
                  {t('clothingDetails.dressCode')}
                </AppText>
                <AppText style={styles.metaValue}>{formalityLabel}</AppText>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>
                  {t('clothingDetails.added')}
                </AppText>
                <AppText style={styles.metaValue}>{createdDate}</AppText>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>
                  {t('clothingDetails.favorite')}
                </AppText>
                <AppText style={styles.metaValue}>
                  {item.isFavorite
                    ? t('clothingDetails.yes')
                    : t('clothingDetails.notYet')}
                </AppText>
              </View>
            </View>

            {isEditingDetails ? (
              <View style={styles.classificationEditor}>
                <View style={styles.editorGroup}>
                  <AppText style={styles.editorLabel}>
                    {t('clothingDetails.name')}
                  </AppText>
                  <AppTextInput
                    accessibilityLabel={t('clothingDetails.nameAccessibility')}
                    autoCapitalize="sentences"
                    editable={!isSavingDetails}
                    maxLength={80}
                    onChangeText={setDraftName}
                    placeholder={t('clothingDetails.namePlaceholder')}
                    placeholderTextColor={Palette.muted}
                    returnKeyType="done"
                    style={styles.nameInput}
                    value={draftName}
                  />
                </View>

                <View style={styles.editorGroup}>
                  <AppText style={styles.editorLabel}>
                    {t('clothingDetails.category')}
                  </AppText>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map((option) => (
                      <ClassificationChip
                        isSelected={draftCategory === option.value}
                        key={option.value}
                        label={t(`options.categories.${option.value}`)}
                        onPress={() => setDraftCategory(option.value)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.editorGroup}>
                  <AppText style={styles.editorLabel}>
                    {t('clothingDetails.dressCode')}
                  </AppText>
                  <View style={styles.chipRow}>
                    {FORMALITY_LEVELS.map((option) => (
                      <ClassificationChip
                        isSelected={draftFormality === option.value}
                        key={option.value}
                        label={t(`options.formalities.${option.value}.label`)}
                        onPress={() => setDraftFormality(option.value)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.editorGroup}>
                  <AppText style={styles.editorLabel}>
                    {t('clothingDetails.mainColor')}
                  </AppText>
                  <ClothingColorPicker
                    disabled={isSavingDetails}
                    onChange={setDraftColor}
                    value={draftColor}
                  />
                </View>

                <View style={styles.editorActions}>
                  <Pressable
                    accessibilityLabel={t(
                      'clothingDetails.accessibility.cancelChanges',
                    )}
                    accessibilityRole="button"
                    disabled={isSavingDetails}
                    onPress={() => setIsEditingDetails(false)}
                    style={({ pressed }) => [
                      styles.editorButton,
                      styles.editorCancelButton,
                      pressed && styles.pressed,
                    ]}>
                    <AppText style={styles.editorCancelText}>
                      {t('common.cancel')}
                    </AppText>
                  </Pressable>

                  <Pressable
                    accessibilityLabel={t(
                      'clothingDetails.accessibility.saveChanges',
                    )}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isSavingDetails }}
                    disabled={isSavingDetails}
                    onPress={() => void saveDetails()}
                    style={({ pressed }) => [
                      styles.editorButton,
                      styles.editorSaveButton,
                      pressed && styles.pressed,
                    ]}>
                    {isSavingDetails ? (
                      <ActivityIndicator
                        accessibilityLabel={t(
                          'clothingDetails.accessibility.savingChanges',
                        )}
                        color={Palette.white}
                        size="small"
                      />
                    ) : (
                      <AppText style={styles.editorSaveText}>
                        {t('clothingDetails.saveChanges')}
                      </AppText>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityLabel={t('clothingDetails.accessibility.edit')}
                accessibilityRole="button"
                onPress={startEditingDetails}
                style={({ pressed }) => [
                  styles.classificationButton,
                  pressed && styles.pressed,
                ]}>
                <AppText style={styles.classificationButtonText}>
                  {t('common.edit')}
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
                {item.isFavorite
                  ? t('clothingDetails.savedFavorite')
                  : t('clothingDetails.addFavorite')}
              </AppText>
            </Pressable>
          </View>

          <Pressable
            accessibilityLabel={t('clothingDetails.accessibility.delete')}
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
                <AppText style={styles.deleteText}>
                  {t('clothingDetails.removeFromCloset')}
                </AppText>
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
  nameInput: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: Radius.medium,
    color: Palette.ink,
    fontSize: 14,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
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
