import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { AppText } from '@/components/app-text';
import { Layout, Palette, Radius } from '@/constants/design';
import { recommendOutfit } from '@/features/outfits/recommendation';
import {
  OUTFIT_OCCASIONS,
  type OutfitOccasion,
} from '@/features/outfits/types';
import {
  FORMALITY_LEVELS,
  type ClothingFormality,
} from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';
import { getLocalizedErrorMessage } from '@/i18n';

type DateOption = {
  value: string;
  weekday: string;
  date: string;
  relativeLabel: 'today' | 'tomorrow' | null;
};

const CHANGE_CATEGORY_BY_LABEL = {
  'Change top': 'tops',
  'Change bottom': 'bottoms',
  'Change dress': 'dresses',
  'Change outerwear': 'outerwear',
  'Change shoes': 'shoes',
  'Change accessory': 'accessories',
} as const;

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createDateOptions(locale: string): DateOption[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      value: toLocalDateValue(date),
      weekday: new Intl.DateTimeFormat(locale, {
        weekday: 'short',
      }).format(date),
      date: new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
      }).format(date),
      relativeLabel: index === 0 ? 'today' : index === 1 ? 'tomorrow' : null,
    };
  });
}

export default function RecommendOutfitScreen() {
  const { t, i18n } = useTranslation();
  const { items, saveOutfit } = useWardrobe();
  const locale = i18n.resolvedLanguage === 'th' ? 'th-TH' : 'en-US';
  const dateOptions = useMemo(() => createDateOptions(locale), [locale]);
  const [occasion, setOccasion] = useState<OutfitOccasion>('everyday');
  const [formality, setFormality] = useState<ClothingFormality>('casual');
  const [plannedFor, setPlannedFor] = useState(dateOptions[0].value);
  const [seed, setSeed] = useState(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isSavingOutfit, setIsSavingOutfit] = useState(false);
  const [savedRecommendationKey, setSavedRecommendationKey] = useState<string | null>(null);

  const recommendation = useMemo(
    () =>
      recommendOutfit(items, {
        occasion,
        formality,
        plannedFor,
        seed,
      }),
    [formality, items, occasion, plannedFor, seed],
  );

  const occasionLabel = OUTFIT_OCCASIONS.find(
    (option) => option.value === occasion,
  );
  const formalityLabel = FORMALITY_LEVELS.find(
    (option) => option.value === formality,
  );
  const plannedDateLabel = dateOptions.find(
    (option) => option.value === plannedFor,
  )?.date;
  const recommendationKey = `${occasion}:${formality}:${plannedFor}:${recommendation.items
    .map((item) => item.id)
    .join('|')}`;
  const isSaved = savedRecommendationKey === recommendationKey;
  const changeCategory =
    CHANGE_CATEGORY_BY_LABEL[
      recommendation.tryAnotherLabel as keyof typeof CHANGE_CATEGORY_BY_LABEL
    ];
  const changeCategoryLabel = changeCategory
    ? t(`options.categories.${changeCategory}`)
    : null;
  const tryAnotherLabel = changeCategoryLabel
    ? t('recommendOutfit.changeCategory', { category: changeCategoryLabel })
    : t(
        recommendation.canTryAnother
          ? 'recommendOutfit.tryAnother'
          : 'recommendOutfit.noOtherLook',
      );

  const changeOccasion = (value: OutfitOccasion) => {
    setOccasion(value);
    setSeed(0);
    setHasGenerated(false);
    setSavedRecommendationKey(null);
  };

  const changeFormality = (value: ClothingFormality) => {
    setFormality(value);
    setSeed(0);
    setHasGenerated(false);
    setSavedRecommendationKey(null);
  };

  const changeDate = (value: string) => {
    setPlannedFor(value);
    setSeed(0);
    setHasGenerated(false);
    setSavedRecommendationKey(null);
  };

  const saveRecommendation = async () => {
    if (!recommendation.isComplete || isSavingOutfit || isSaved) {
      return;
    }

    setIsSavingOutfit(true);

    try {
      await saveOutfit({
        itemIds: recommendation.items.map((item) => item.id),
        formality,
        occasion,
        plannedFor,
      });
      setSavedRecommendationKey(recommendationKey);
    } catch (error) {
      Alert.alert(
        t('recommendOutfit.saveErrorTitle'),
        getLocalizedErrorMessage(error, t('common.tryAgain')),
      );
    } finally {
      setIsSavingOutfit(false);
    }
  };

  const tryAnother = () => {
    if (!recommendation.canTryAnother) {
      return;
    }

    setSavedRecommendationKey(null);
    setSeed((value) => value + 1);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={t('recommendOutfit.close')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.roundButton,
              pressed && styles.pressed,
            ]}>
            <AppText style={styles.closeIcon}>×</AppText>
          </Pressable>

          <AppText style={styles.topBarTitle}>
            {t('recommendOutfit.plannerTitle')}
          </AppText>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <AppText style={styles.eyebrow}>{t('recommendOutfit.eyebrow')}</AppText>
            <AppText style={styles.title}>{t('recommendOutfit.title')}</AppText>
            <AppText style={styles.subtitle}>{t('recommendOutfit.subtitle')}</AppText>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <AppText style={styles.stepText}>1</AppText>
              </View>
              <View style={styles.sectionCopy}>
                <AppText style={styles.sectionTitle}>
                  {t('recommendOutfit.occasion')}
                </AppText>
                <AppText style={styles.sectionHint}>
                  {t('recommendOutfit.occasionHint')}
                </AppText>
              </View>
            </View>

            <View style={styles.occasionGrid}>
              {OUTFIT_OCCASIONS.map((option) => {
                const isSelected = option.value === occasion;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={option.value}
                    onPress={() => changeOccasion(option.value)}
                    style={({ pressed }) => [
                      styles.occasionChip,
                      isSelected && styles.occasionChipSelected,
                      pressed && styles.pressed,
                    ]}>
                    <AppText
                      style={[
                        styles.occasionIcon,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {option.icon}
                    </AppText>
                    <AppText
                      numberOfLines={1}
                      style={[
                        styles.occasionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {t(`options.occasions.${option.value}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <AppText style={styles.stepText}>2</AppText>
              </View>
              <View style={styles.sectionCopy}>
                <AppText style={styles.sectionTitle}>
                  {t('recommendOutfit.dressCode')}
                </AppText>
                <AppText style={styles.sectionHint}>
                  {t('recommendOutfit.dressCodeHint')}
                </AppText>
              </View>
            </View>

            <View style={styles.formalityRow}>
              {FORMALITY_LEVELS.map((option) => {
                const isSelected = option.value === formality;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={option.value}
                    onPress={() => changeFormality(option.value)}
                    style={({ pressed }) => [
                      styles.formalityChip,
                      isSelected && styles.formalityChipSelected,
                      pressed && styles.pressed,
                    ]}>
                    <AppText
                      style={[
                        styles.formalityText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {t(`options.formalities.${option.value}.label`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <AppText style={styles.stepText}>3</AppText>
              </View>
              <View style={styles.sectionCopy}>
                <AppText style={styles.sectionTitle}>{t('recommendOutfit.date')}</AppText>
                <AppText style={styles.sectionHint}>
                  {t('recommendOutfit.dateHint')}
                </AppText>
              </View>
            </View>

            <ScrollView
              horizontal
              contentContainerStyle={styles.dateRow}
              showsHorizontalScrollIndicator={false}>
              {dateOptions.map((option) => {
                const isSelected = option.value === plannedFor;
                const dateLabel = option.relativeLabel
                  ? t(`recommendOutfit.${option.relativeLabel}`)
                  : option.weekday;

                return (
                  <Pressable
                    accessibilityLabel={t('recommendOutfit.dateAccessibility', {
                      label: dateLabel,
                      date: option.date,
                    })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={option.value}
                    onPress={() => changeDate(option.value)}
                    style={({ pressed }) => [
                      styles.dateChip,
                      isSelected && styles.dateChipSelected,
                      pressed && styles.pressed,
                    ]}>
                    <AppText
                      style={[
                        styles.dateWeekday,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {dateLabel}
                    </AppText>
                    <AppText
                      style={[
                        styles.dateValue,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {option.date}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSeed(0);
              setHasGenerated(true);
            }}
            style={({ pressed }) => [styles.buildButton, pressed && styles.pressed]}>
            <AppText style={styles.buildButtonText}>
              {t('recommendOutfit.build')}
            </AppText>
            <AppText style={styles.buildButtonIcon}>✦</AppText>
          </Pressable>

          {hasGenerated && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeading}>
                <View style={styles.resultCopy}>
                  <AppText style={styles.resultEyebrow}>
                    {t('recommendOutfit.resultEyebrow')}
                  </AppText>
                  <AppText style={styles.resultTitle}>
                    {occasionLabel
                      ? t(`options.occasions.${occasionLabel.value}`)
                      : ''}{' '}
                    ·{' '}
                    {formalityLabel
                      ? t(`options.formalities.${formalityLabel.value}.label`)
                      : ''}
                  </AppText>
                  <AppText style={styles.resultDate}>{plannedDateLabel}</AppText>
                </View>

                {recommendation.isComplete && (
                  <View style={styles.readyBadge}>
                    <AppText style={styles.readyBadgeText}>
                      {t('recommendOutfit.ready')}
                    </AppText>
                  </View>
                )}
              </View>

              {recommendation.items.length > 0 && (
                <View style={styles.outfitGrid}>
                  {recommendation.items.map((item) => (
                    <Pressable
                      accessibilityLabel={t('common.openItem', { name: item.name })}
                      accessibilityRole="button"
                      key={item.id}
                      onPress={() =>
                        router.push({
                          pathname: '/clothes',
                          params: { id: item.id },
                        })
                      }
                      style={({ pressed }) => [
                        styles.outfitItem,
                        pressed && styles.pressed,
                      ]}>
                      <Image
                        contentFit="cover"
                        source={{ uri: item.imageUri }}
                        style={styles.outfitImage}
                      />
                      <View style={styles.outfitItemCopy}>
                        <AppText numberOfLines={1} style={styles.outfitItemName}>
                          {item.name}
                        </AppText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {recommendation.isComplete ? (
                <View style={styles.resultActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      busy: isSavingOutfit,
                      disabled: isSavingOutfit || isSaved,
                    }}
                    disabled={isSavingOutfit || isSaved}
                    onPress={() => void saveRecommendation()}
                    style={({ pressed }) => [
                      styles.saveOutfitButton,
                      isSaved && styles.saveOutfitButtonSaved,
                      pressed && styles.pressed,
                    ]}>
                    {isSavingOutfit ? (
                      <ActivityIndicator color={Palette.brand} size="small" />
                    ) : (
                      <AppText
                        style={[
                          styles.saveOutfitButtonText,
                          isSaved && styles.saveOutfitButtonTextSaved,
                        ]}>
                        {isSaved
                          ? t('recommendOutfit.saved')
                          : t('recommendOutfit.save')}
                      </AppText>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: !recommendation.canTryAnother,
                    }}
                    disabled={!recommendation.canTryAnother}
                    onPress={tryAnother}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      !recommendation.canTryAnother && styles.secondaryButtonDisabled,
                      pressed && styles.pressed,
                    ]}>
                    <AppText style={styles.secondaryButtonIcon}>↻</AppText>
                    <AppText style={styles.secondaryButtonText}>
                      {tryAnotherLabel}
                    </AppText>
                  </Pressable>

                  <Pressable
                    accessibilityHint={t('recommendOutfit.mixHint')}
                    accessibilityLabel={t('recommendOutfit.mixAccessibility')}
                    accessibilityRole="button"
                    onPress={() =>
                      router.navigate({
                        pathname: '/try-outfits',
                        params: {
                          itemIds: recommendation.items.map((item) => item.id).join(','),
                          occasion,
                          formality,
                          plannedFor,
                          importToken: `${Date.now()}`,
                        },
                      } as Href)
                    }
                    style={({ pressed }) => [
                      styles.mixLookButton,
                      pressed && styles.pressed,
                    ]}>
                    <AppText style={styles.mixLookButtonIcon}>↔</AppText>
                    <AppText style={styles.mixLookButtonText}>
                      {t('recommendOutfit.mix')}
                    </AppText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.missingCard}>
                  <AppText style={styles.missingTitle}>
                    {t('recommendOutfit.missingTitle')}
                  </AppText>
                  <AppText style={styles.missingBody}>
                    {t('recommendOutfit.missingBody')}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/add-clothes')}
                    style={({ pressed }) => [
                      styles.addButton,
                      pressed && styles.pressed,
                    ]}>
                    <AppText style={styles.addButtonText}>
                      {t('recommendOutfit.addClothes')}
                    </AppText>
                  </Pressable>
                </View>
              )}

              {recommendation.isComplete && recommendation.variationMessage && (
                <AppText style={styles.variationMessage}>
                  {changeCategoryLabel
                    ? t('recommendOutfit.variationCategory', {
                        category: changeCategoryLabel,
                      })
                    : t('recommendOutfit.variationOnly')}
                </AppText>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
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
  closeIcon: { color: Palette.ink, fontSize: 27, lineHeight: 28, fontWeight: '300' },
  topBarTitle: { color: Palette.ink, fontSize: 15, fontWeight: '700' },
  topBarSpacer: { width: 46 },
  scrollContent: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: Layout.gutter,
    paddingTop: 10,
    paddingBottom: 44,
    gap: 18,
  },
  intro: { gap: 7, marginBottom: 4 },
  eyebrow: {
    color: Palette.coral,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: Palette.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: { color: Palette.muted, fontSize: 14, lineHeight: 21 },
  section: {
    gap: 15,
    padding: 18,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.brandSoft,
  },
  stepText: { color: Palette.brand, fontSize: 13, fontWeight: '800' },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: Palette.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  sectionHint: { color: Palette.muted, fontSize: 12, lineHeight: 17 },
  occasionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  occasionChip: {
    width: '48%',
    flexGrow: 1,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  occasionChipSelected: { backgroundColor: Palette.brand, borderColor: Palette.brand },
  occasionIcon: { color: Palette.brand, width: 20, fontSize: 17, textAlign: 'center' },
  occasionText: { color: Palette.ink, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  optionTextSelected: { color: Palette.white },
  formalityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formalityChip: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  formalityChipSelected: { backgroundColor: Palette.brand, borderColor: Palette.brand },
  formalityText: { color: Palette.ink, fontSize: 13, fontWeight: '700' },
  dateRow: { gap: 8, paddingRight: 2 },
  dateChip: {
    width: 88,
    minHeight: 64,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  dateChipSelected: { backgroundColor: Palette.brand, borderColor: Palette.brand },
  dateWeekday: { color: Palette.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  dateValue: { color: Palette.muted, fontSize: 11, lineHeight: 15 },
  buildButton: {
    minHeight: 58,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: Palette.coral,
  },
  buildButtonText: { color: Palette.white, fontSize: 16, fontWeight: '800' },
  buildButtonIcon: { color: Palette.white, fontSize: 18 },
  resultSection: {
    gap: 16,
    padding: 18,
    borderRadius: Radius.large,
    backgroundColor: Palette.brandDark,
  },
  resultHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultCopy: { flex: 1 },
  resultEyebrow: {
    color: '#BDB8FF',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  resultTitle: { color: Palette.white, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  resultDate: { color: '#D7D4FF', fontSize: 12, lineHeight: 18 },
  readyBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  readyBadgeText: { color: Palette.white, fontSize: 11, fontWeight: '800' },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  outfitItem: {
    width: '48%',
    flexGrow: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
  },
  outfitImage: { width: '100%', aspectRatio: 0.9, backgroundColor: Palette.lavender },
  outfitItemCopy: { paddingHorizontal: 11, paddingVertical: 10 },
  outfitItemName: { color: Palette.ink, fontSize: 12, fontWeight: '700' },
  resultActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  saveOutfitButton: {
    flex: 1,
    minWidth: 140,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.coral,
  },
  saveOutfitButtonSaved: { backgroundColor: Palette.white },
  saveOutfitButtonText: { color: Palette.white, fontSize: 14, fontWeight: '800' },
  saveOutfitButtonTextSaved: { color: Palette.brand },
  secondaryButton: {
    flex: 1,
    minWidth: 140,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Palette.white,
  },
  secondaryButtonDisabled: { opacity: 0.58 },
  secondaryButtonIcon: { color: Palette.brand, fontSize: 18, fontWeight: '700' },
  secondaryButtonText: { color: Palette.brand, fontSize: 14, fontWeight: '700' },
  mixLookButton: {
    width: '100%',
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mixLookButtonIcon: { color: Palette.white, fontSize: 18, fontWeight: '700' },
  mixLookButtonText: { color: Palette.white, fontSize: 14, fontWeight: '700' },
  variationMessage: {
    color: '#D7D4FF',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  missingCard: { gap: 7, padding: 16, borderRadius: Radius.medium, backgroundColor: Palette.white },
  missingTitle: { color: Palette.ink, fontSize: 16, fontWeight: '700' },
  missingBody: { color: Palette.muted, fontSize: 13, lineHeight: 19 },
  addButton: {
    minHeight: 44,
    marginTop: 5,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.brandSoft,
  },
  addButtonText: { color: Palette.brand, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
});
