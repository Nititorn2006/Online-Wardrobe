import { Image } from 'expo-image';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Layout, Palette, Radius } from '@/constants/design';
import {
  buildSlotPools,
  canShuffle,
  createMixMatchDraft,
  createMixMatchSignature,
  cycleSlot,
  getMixMatchReadiness,
  getSelectedItemIds,
  getSlotOptions,
  getSuggestedFormality,
  reconcileMixMatchDraft,
  shuffleUnlocked,
  toggleSlotLock,
  type OutfitMode,
  type OutfitSlot,
} from '@/features/outfits/mix-match';
import { isDateValue } from '@/features/outfits/outfit-schema';
import {
  isOutfitOccasion,
  OUTFIT_OCCASIONS,
  type OutfitOccasion,
} from '@/features/outfits/types';
import {
  FORMALITY_LEVELS,
  isClothingFormality,
  type ClothingFormality,
} from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

type DateOption = {
  value: string;
  weekday: string;
  date: string;
  relativeLabel: string | null;
};

const SLOT_LABELS: Record<OutfitSlot, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  shoes: 'Shoes',
  outerwear: 'Layer',
  accessory: 'Accessory',
};

const TAB_BAR_HEIGHT = 78;
const ACTION_TAB_GAP = 12;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createDateOptions(): DateOption[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      value: toLocalDateValue(date),
      weekday: new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
      }).format(date),
      date: new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
      }).format(date),
      relativeLabel: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : null,
    };
  });
}

export default function TryOutfitsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    itemIds?: string | string[];
    occasion?: string | string[];
    formality?: string | string[];
    importToken?: string | string[];
    plannedFor?: string | string[];
  }>();
  const { items, saveOutfit } = useWardrobe();
  const dateOptions = useMemo(() => createDateOptions(), []);
  const itemIdsParam = firstParam(params.itemIds);
  const incomingOccasion = firstParam(params.occasion);
  const incomingFormality = firstParam(params.formality);
  const incomingDate = firstParam(params.plannedFor);
  const importToken = firstParam(params.importToken);
  const initialItemIds = useMemo(
    () =>
      (itemIdsParam ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    [itemIdsParam],
  );
  const initialDraft = useMemo(
    () => createMixMatchDraft(items, initialItemIds),
    [initialItemIds, items],
  );
  const pools = useMemo(() => buildSlotPools(items), [items]);
  const [draft, setDraft] = useState(initialDraft);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const lastAppliedImportToken = useRef(importToken);
  const [occasion, setOccasion] = useState<OutfitOccasion>(() =>
    isOutfitOccasion(incomingOccasion) ? incomingOccasion : 'everyday',
  );
  const [formality, setFormality] = useState<ClothingFormality>(() =>
    isClothingFormality(incomingFormality)
      ? incomingFormality
      : getSuggestedFormality(items, getSelectedItemIds(initialDraft)),
  );
  const [plannedFor, setPlannedFor] = useState(() =>
    isDateValue(incomingDate) ? incomingDate : dateOptions[0].value,
  );

  useEffect(() => {
    if (!importToken || lastAppliedImportToken.current === importToken) {
      return;
    }

    const importedDraft = createMixMatchDraft(items, initialItemIds);
    setDraft(importedDraft);
    setOccasion(isOutfitOccasion(incomingOccasion) ? incomingOccasion : 'everyday');
    setFormality(
      isClothingFormality(incomingFormality)
        ? incomingFormality
        : getSuggestedFormality(items, getSelectedItemIds(importedDraft)),
    );
    setPlannedFor(isDateValue(incomingDate) ? incomingDate : dateOptions[0].value);
    setSavedSignature(null);
    lastAppliedImportToken.current = importToken;
  }, [
    dateOptions,
    importToken,
    incomingDate,
    incomingFormality,
    incomingOccasion,
    initialItemIds,
    items,
  ]);

  const resolvedDraft = useMemo(
    () => reconcileMixMatchDraft(draft, pools),
    [draft, pools],
  );
  const selectedItemIds = getSelectedItemIds(resolvedDraft);
  const readiness = getMixMatchReadiness(resolvedDraft);
  const shuffleAvailable = canShuffle(resolvedDraft, pools);
  const currentSignature = createMixMatchSignature(resolvedDraft, {
    occasion,
    formality,
    plannedFor,
  });
  const isSaved = savedSignature === currentSignature;

  const changeMode = (mode: OutfitMode) => {
    setDraft((current) => ({
      ...reconcileMixMatchDraft(current, pools),
      mode,
    }));
  };

  const changeSlot = (slot: OutfitSlot, direction: -1 | 1) => {
    setDraft((current) =>
      cycleSlot(
        reconcileMixMatchDraft(current, pools),
        slot,
        direction,
        pools,
      ),
    );
  };

  const toggleLock = (slot: OutfitSlot) => {
    setDraft((current) =>
      toggleSlotLock(reconcileMixMatchDraft(current, pools), slot),
    );
  };

  const shuffle = () => {
    setDraft((current) =>
      shuffleUnlocked(reconcileMixMatchDraft(current, pools), pools),
    );
  };

  const handleSave = async () => {
    if (!readiness.canSave || isSaving || isSaved) {
      return;
    }

    setIsSaving(true);

    try {
      await saveOutfit({
        itemIds: selectedItemIds,
        occasion,
        formality,
        plannedFor,
      });
      setSavedSignature(currentSignature);
      setIsSaveOpen(false);
    } catch (error) {
      Alert.alert(
        'Couldn’t save this outfit',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderSlot = (slot: OutfitSlot, compact = false) => {
    const selectedId = resolvedDraft.selected[slot];
    const selectedItem = pools[slot].find((item) => item.id === selectedId);
    const hasAlternatives = getSlotOptions(slot, pools).some(
      (option) => option !== selectedId,
    );
    const isLocked = resolvedDraft.locked[slot];
    const hasClothes = pools[slot].length > 0;

    return (
      <View key={slot} style={[styles.slotTile, compact && styles.compactSlotTile]}>
        {selectedItem ? (
          <Pressable
            accessibilityLabel={`Open ${selectedItem.name}`}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/clothes',
                params: { id: selectedItem.id },
              })
            }
            style={({ pressed }) => [styles.tilePreview, pressed && styles.pressed]}>
            <Image
              contentFit="contain"
              source={{ uri: selectedItem.imageUri }}
              style={styles.tileImage}
            />
            <View style={styles.tileCaption}>
              <View style={styles.tileCaptionCopy}>
                <AppText numberOfLines={1} style={styles.tileLabel}>
                  {SLOT_LABELS[slot]}
                </AppText>
                <AppText numberOfLines={1} style={styles.tileName}>
                  {selectedItem.name}
                </AppText>
              </View>
              <View
                accessibilityLabel={`Color ${selectedItem.color}`}
                style={[styles.colorDot, { backgroundColor: selectedItem.color }]}
              />
            </View>
          </Pressable>
        ) : (
          <View style={styles.emptyTile}>
            <AppText style={styles.emptyIcon}>＋</AppText>
            <AppText numberOfLines={1} style={styles.emptyLabel}>
              {hasClothes ? 'None' : SLOT_LABELS[slot]}
            </AppText>
            {!hasClothes && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/add-clothes' as Href)}
                style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}>
                <AppText style={styles.addLinkText}>Add</AppText>
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          accessibilityLabel={`${isLocked ? 'Unlock' : 'Keep'} ${SLOT_LABELS[slot].toLowerCase()} during shuffle`}
          accessibilityRole="button"
          accessibilityState={{ selected: isLocked }}
          hitSlop={compact ? 8 : 5}
          onPress={() => toggleLock(slot)}
          style={({ pressed }) => [
            styles.keepButton,
            compact && styles.keepButtonCompact,
            isLocked && styles.keepButtonSelected,
            pressed && styles.pressed,
          ]}>
          <AppText
            style={[
              styles.keepButtonText,
              isLocked && styles.keepButtonTextSelected,
            ]}>
            {compact ? (isLocked ? '●' : '○') : isLocked ? '● Kept' : '○ Keep'}
          </AppText>
        </Pressable>

        <Pressable
          accessibilityLabel={`Previous ${SLOT_LABELS[slot].toLowerCase()}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasAlternatives }}
          disabled={!hasAlternatives}
          hitSlop={compact ? 7 : 2}
          onPress={() => changeSlot(slot, -1)}
          style={({ pressed }) => [
            styles.tileArrow,
            styles.tileArrowLeft,
            compact && styles.tileArrowCompact,
            !hasAlternatives && styles.tileArrowDisabled,
            pressed && styles.pressed,
          ]}>
          <AppText style={styles.tileArrowText}>‹</AppText>
        </Pressable>

        <Pressable
          accessibilityLabel={`Next ${SLOT_LABELS[slot].toLowerCase()}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasAlternatives }}
          disabled={!hasAlternatives}
          hitSlop={compact ? 7 : 2}
          onPress={() => changeSlot(slot, 1)}
          style={({ pressed }) => [
            styles.tileArrow,
            styles.tileArrowRight,
            compact && styles.tileArrowCompact,
            !hasAlternatives && styles.tileArrowDisabled,
            pressed && styles.pressed,
          ]}>
          <AppText style={styles.tileArrowText}>›</AppText>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View
          style={[
            styles.content,
            {
              paddingBottom:
                TAB_BAR_HEIGHT +
                Math.max(insets.bottom, 12) +
                ACTION_TAB_GAP,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText style={styles.eyebrow}>MIX &amp; MATCH</AppText>
              <AppText style={styles.title}>Try outfits</AppText>
            </View>
            <AppText numberOfLines={2} style={styles.headerHint}>
              Swap pieces or keep what you love.
            </AppText>
          </View>

          <View style={styles.modeControl}>
            {(
              [
                { value: 'separates', label: 'Top + bottom' },
                { value: 'dress', label: 'Dress' },
              ] as const
            ).map((option) => {
              const isSelected = resolvedDraft.mode === option.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.value}
                  onPress={() => changeMode(option.value)}
                  style={({ pressed }) => [
                    styles.modeButton,
                    isSelected && styles.modeButtonSelected,
                    pressed && styles.pressed,
                  ]}>
                  <AppText
                    style={[
                      styles.modeButtonText,
                      isSelected && styles.modeButtonTextSelected,
                    ]}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.outfitBoard}>
            <View style={styles.coreRow}>
              {resolvedDraft.mode === 'separates' ? (
                <>
                  {renderSlot('top')}
                  {renderSlot('bottom')}
                </>
              ) : (
                renderSlot('dress')
              )}
            </View>

            <View style={styles.extraRow}>
              {renderSlot('shoes', true)}
              {renderSlot('outerwear', true)}
              {renderSlot('accessory', true)}
            </View>
          </View>

          <View>
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !shuffleAvailable }}
                disabled={!shuffleAvailable}
                onPress={shuffle}
                style={({ pressed }) => [
                  styles.shuffleButton,
                  !shuffleAvailable && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}>
                <AppText style={styles.shuffleIcon}>↻</AppText>
                <AppText style={styles.shuffleText}>Shuffle</AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !readiness.canSave || isSaved }}
                disabled={!readiness.canSave || isSaved}
                onPress={() => setIsSaveOpen(true)}
                style={({ pressed }) => [
                  styles.saveButton,
                  (!readiness.canSave || isSaved) && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}>
                <AppText style={styles.saveButtonText}>
                  {isSaved ? '✓ Saved' : 'Save outfit'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsSaveOpen(false)}
        transparent
        visible={isSaveOpen}>
        <View style={styles.modalBackdrop}>
          <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <AppText style={styles.modalEyebrow}>SAVE COMPLETE LOOK</AppText>
                <AppText style={styles.modalTitle}>When will you wear it?</AppText>
              </View>
              <Pressable
                accessibilityLabel="Close save outfit"
                accessibilityRole="button"
                onPress={() => setIsSaveOpen(false)}
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}>
                <AppText style={styles.modalCloseText}>×</AppText>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <AppText style={styles.modalLabel}>Occasion</AppText>
                <View style={styles.chipWrap}>
                  {OUTFIT_OCCASIONS.map((option) => {
                    const isSelected = option.value === occasion;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={option.value}
                        onPress={() => setOccasion(option.value)}
                        style={({ pressed }) => [
                          styles.chip,
                          isSelected && styles.chipSelected,
                          pressed && styles.pressed,
                        ]}>
                        <AppText
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}>
                          {option.icon} {option.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSection}>
                <AppText style={styles.modalLabel}>Dress code</AppText>
                <View style={styles.chipWrap}>
                  {FORMALITY_LEVELS.map((option) => {
                    const isSelected = option.value === formality;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={option.value}
                        onPress={() => setFormality(option.value)}
                        style={({ pressed }) => [
                          styles.chip,
                          isSelected && styles.chipSelected,
                          pressed && styles.pressed,
                        ]}>
                        <AppText
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}>
                          {option.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSection}>
                <AppText style={styles.modalLabel}>Date</AppText>
                <ScrollView
                  horizontal
                  contentContainerStyle={styles.dateRow}
                  showsHorizontalScrollIndicator={false}>
                  {dateOptions.map((option) => {
                    const isSelected = option.value === plannedFor;

                    return (
                      <Pressable
                        accessibilityLabel={`${option.relativeLabel ?? option.weekday}, ${option.date}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        key={option.value}
                        onPress={() => setPlannedFor(option.value)}
                        style={({ pressed }) => [
                          styles.dateChip,
                          isSelected && styles.dateChipSelected,
                          pressed && styles.pressed,
                        ]}>
                        <AppText
                          style={[
                            styles.dateWeekday,
                            isSelected && styles.chipTextSelected,
                          ]}>
                          {option.relativeLabel ?? option.weekday}
                        </AppText>
                        <AppText
                          style={[
                            styles.dateValue,
                            isSelected && styles.chipTextSelected,
                          ]}>
                          {option.date}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isSaving, disabled: isSaving }}
              disabled={isSaving}
              onPress={() => void handleSave()}
              style={({ pressed }) => [
                styles.modalSaveButton,
                isSaving && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}>
              {isSaving ? (
                <ActivityIndicator color={Palette.white} size="small" />
              ) : (
                <AppText style={styles.modalSaveButtonText}>
                  Save {selectedItemIds.length}-piece outfit
                </AppText>
              )}
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    flex: 1,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 7,
    gap: 9,
  },
  header: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: Palette.coral,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: { color: Palette.ink, fontSize: 24, lineHeight: 29, fontWeight: '700' },
  headerHint: {
    width: 132,
    color: Palette.muted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'right',
  },
  modeControl: {
    height: 43,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modeButton: {
    flex: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonSelected: { backgroundColor: Palette.brand },
  modeButtonText: { color: Palette.ink, fontSize: 12, fontWeight: '700' },
  modeButtonTextSelected: { color: Palette.white },
  outfitBoard: { flex: 1, minHeight: 0, gap: 8 },
  coreRow: { flex: 1.65, minHeight: 0, flexDirection: 'row', gap: 8 },
  extraRow: { flex: 1, minHeight: 0, flexDirection: 'row', gap: 8 },
  slotTile: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    borderRadius: Radius.medium,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  compactSlotTile: { borderRadius: Radius.small },
  tilePreview: { flex: 1, minHeight: 0 },
  tileImage: { flex: 1, width: '100%', backgroundColor: Palette.lavender },
  tileCaption: {
    minHeight: 42,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Palette.surface,
  },
  tileCaptionCopy: { flex: 1, minWidth: 0 },
  tileLabel: { color: Palette.brand, fontSize: 8, lineHeight: 10, fontWeight: '800' },
  tileName: { color: Palette.ink, fontSize: 10, lineHeight: 13, fontWeight: '700' },
  colorDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(32,40,38,0.18)',
  },
  emptyTile: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 5,
    backgroundColor: '#F1EFEB',
  },
  emptyIcon: { color: Palette.brand, fontSize: 22, lineHeight: 23 },
  emptyLabel: {
    color: Palette.muted,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  addLink: { minHeight: 28, justifyContent: 'center', paddingHorizontal: 7 },
  addLinkText: { color: Palette.brand, fontSize: 10, fontWeight: '800' },
  keepButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    minWidth: 55,
    height: 27,
    paddingHorizontal: 7,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(32,40,38,0.12)',
  },
  keepButtonCompact: { top: 5, right: 5, minWidth: 28, height: 28, paddingHorizontal: 4 },
  keepButtonSelected: { backgroundColor: Palette.brand, borderColor: Palette.brand },
  keepButtonText: { color: Palette.ink, fontSize: 8, fontWeight: '800' },
  keepButtonTextSelected: { color: Palette.white },
  tileArrow: {
    position: 'absolute',
    top: '45%',
    width: 31,
    height: 42,
    marginTop: -21,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  tileArrowCompact: { width: 28, height: 38, marginTop: -19 },
  tileArrowLeft: { left: 5 },
  tileArrowRight: { right: 5 },
  tileArrowDisabled: { opacity: 0.28 },
  tileArrowText: { color: Palette.brand, fontSize: 23, lineHeight: 24, fontWeight: '700' },
  actionRow: { height: 49, flexDirection: 'row', gap: 8 },
  shuffleButton: {
    flex: 1,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.brand,
  },
  shuffleIcon: { color: Palette.white, fontSize: 18, fontWeight: '700' },
  shuffleText: { color: Palette.white, fontSize: 13, fontWeight: '800' },
  saveButton: {
    flex: 1,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.coral,
  },
  saveButtonText: { color: Palette.white, fontSize: 13, fontWeight: '800' },
  buttonDisabled: { opacity: 0.43 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,24,23,0.36)',
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: Palette.surface,
    paddingHorizontal: Layout.gutter,
    paddingTop: 10,
    paddingBottom: 12,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    backgroundColor: Palette.border,
    marginBottom: 13,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalHeaderCopy: { flex: 1 },
  modalEyebrow: {
    color: Palette.coral,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modalTitle: { color: Palette.ink, fontSize: 23, lineHeight: 29, fontWeight: '700' },
  modalClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modalCloseText: { color: Palette.ink, fontSize: 25, lineHeight: 27 },
  modalContent: { gap: 20, paddingVertical: 12, paddingBottom: 20 },
  modalSection: { gap: 10 },
  modalLabel: { color: Palette.ink, fontSize: 14, fontWeight: '800' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 42,
    borderRadius: Radius.pill,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipSelected: { backgroundColor: Palette.brand, borderColor: Palette.brand },
  chipText: { color: Palette.ink, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: Palette.white },
  dateRow: { gap: 8, paddingRight: 2 },
  dateChip: {
    width: 86,
    minHeight: 62,
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
  modalSaveButton: {
    minHeight: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.coral,
    marginTop: 8,
  },
  modalSaveButtonText: { color: Palette.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
});
