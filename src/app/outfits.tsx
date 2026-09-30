import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { sortSavedOutfits } from '@/features/outfits/saved-outfit-utils';
import { OUTFIT_OCCASIONS } from '@/features/outfits/types';
import { FORMALITY_LEVELS } from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatPlannedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

export default function SavedOutfitsScreen() {
  const { outfits, items, deleteOutfit } = useWardrobe();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const today = toLocalDateValue(new Date());
  const sortedOutfits = useMemo(
    () => sortSavedOutfits(outfits, today),
    [outfits, today],
  );

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      `Delete ${name}?`,
      'The clothes will stay in My Clothes. Only this saved outfit will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete outfit',
          style: 'destructive',
          onPress: () => void handleDelete(id),
        },
      ],
    );
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await deleteOutfit(id);
    } catch (error) {
      Alert.alert(
        'Couldn’t delete this outfit',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close saved outfits"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
            <AppText style={styles.closeIcon}>×</AppText>
          </Pressable>

          <AppText style={styles.topBarTitle}>Saved outfits</AppText>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <AppText style={styles.eyebrow}>MY LOOKS</AppText>
            <AppText style={styles.title}>Saved outfits</AppText>
            <AppText style={styles.subtitle}>
              Keep complete looks together so they’re ready when you need them.
            </AppText>
          </View>

          {sortedOutfits.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <AppText style={styles.emptyIconText}>✦</AppText>
              </View>
              <AppText style={styles.emptyTitle}>No saved outfits yet</AppText>
              <AppText style={styles.emptyBody}>
                Build a recommendation, then save the whole look here with one tap.
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/recommend-outfit' as Href)}
                style={({ pressed }) => [styles.planButton, pressed && styles.pressed]}>
                <AppText style={styles.planButtonText}>Plan an outfit</AppText>
              </Pressable>
            </View>
          ) : (
            sortedOutfits.map((outfit) => {
              const outfitItems = outfit.itemIds
                .map((id) => items.find((item) => item.id === id))
                .filter((item) => item !== undefined);
              const occasionLabel = OUTFIT_OCCASIONS.find(
                (option) => option.value === outfit.occasion,
              )?.label;
              const formalityLabel = FORMALITY_LEVELS.find(
                (option) => option.value === outfit.formality,
              )?.label;
              const isDeleting = deletingId === outfit.id;

              return (
                <View key={outfit.id} style={styles.outfitCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleCopy}>
                      <AppText style={styles.cardDate}>
                        {formatPlannedDate(outfit.plannedFor)}
                      </AppText>
                      <AppText style={styles.cardTitle}>{outfit.name}</AppText>
                      <AppText style={styles.cardMeta}>
                        {occasionLabel} · {formalityLabel} · {outfitItems.length}{' '}
                        {outfitItems.length === 1 ? 'piece' : 'pieces'}
                      </AppText>
                    </View>

                    <Pressable
                      accessibilityLabel={`Delete ${outfit.name}`}
                      accessibilityRole="button"
                      accessibilityState={{ busy: isDeleting }}
                      disabled={isDeleting}
                      hitSlop={8}
                      onPress={() => confirmDelete(outfit.id, outfit.name)}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.pressed,
                      ]}>
                      {isDeleting ? (
                        <ActivityIndicator color={Palette.danger} size="small" />
                      ) : (
                        <AppText style={styles.deleteButtonText}>⌫</AppText>
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.itemGrid}>
                    {outfitItems.map((item) => (
                      <Pressable
                        accessibilityLabel={`Open ${item.name}`}
                        accessibilityRole="button"
                        key={item.id}
                        onPress={() =>
                          router.push({
                            pathname: '/clothes',
                            params: { id: item.id },
                          })
                        }
                        style={({ pressed }) => [
                          styles.itemTile,
                          pressed && styles.pressed,
                        ]}>
                        <Image
                          contentFit="cover"
                          source={{ uri: item.imageUri }}
                          style={styles.itemImage}
                        />
                        <AppText numberOfLines={1} style={styles.itemName}>
                          {item.name}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })
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
    gap: 16,
  },
  header: { gap: 5, marginBottom: 4 },
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
  emptyCard: {
    marginTop: 16,
    padding: 26,
    borderRadius: Radius.large,
    alignItems: 'center',
    gap: 9,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    marginBottom: 5,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.brandSoft,
  },
  emptyIconText: { color: Palette.brand, fontSize: 27 },
  emptyTitle: { color: Palette.ink, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: Palette.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  planButton: {
    minHeight: 48,
    marginTop: 8,
    paddingHorizontal: 22,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.brand,
  },
  planButtonText: { color: Palette.white, fontSize: 14, fontWeight: '800' },
  outfitCard: {
    padding: 16,
    gap: 15,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitleCopy: { flex: 1, gap: 2 },
  cardDate: {
    color: Palette.brand,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardTitle: { color: Palette.ink, fontSize: 19, lineHeight: 25, fontWeight: '700' },
  cardMeta: { color: Palette.muted, fontSize: 12, lineHeight: 18 },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.coralSoft,
  },
  deleteButtonText: { color: Palette.danger, fontSize: 20, lineHeight: 22 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  itemTile: {
    width: '48%',
    flexGrow: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    backgroundColor: Palette.background,
  },
  itemImage: { width: '100%', aspectRatio: 0.9, backgroundColor: Palette.lavender },
  itemName: { color: Palette.ink, fontSize: 12, fontWeight: '700', padding: 10 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
});
