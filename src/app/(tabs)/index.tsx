import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Layout, Palette, Radius } from '@/constants/design';
import type {
  ClothingCategory,
  ClothingItem,
} from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

const outfitCategories: ClothingCategory[] = [
  'tops',
  'dresses',
  'outerwear',
  'bottoms',
  'shoes',
  'accessories',
];

function pickFrom(
  items: ClothingItem[],
  category: ClothingCategory,
  seed: number,
) {
  const matches = items.filter(
    (item) => item.category === category,
  );

  return matches.length
    ? matches[seed % matches.length]
    : undefined;
}

function buildQuickLook(
  items: ClothingItem[],
  seed: number,
) {
  if (items.length < 2) return [];

  const look: ClothingItem[] = [];

  const dress = pickFrom(
    items,
    'dresses',
    seed,
  );

  const top = pickFrom(
    items,
    'tops',
    seed,
  );

  const outerwear = pickFrom(
    items,
    'outerwear',
    seed + 1,
  );

  if (dress) {
    look.push(dress);
  } else if (top) {
    look.push(top);
  } else if (outerwear) {
    look.push(outerwear);
  }

  if (!dress) {
    const bottom = pickFrom(
      items,
      'bottoms',
      seed + 1,
    );

    if (bottom) {
      look.push(bottom);
    }
  }

  const shoes = pickFrom(
    items,
    'shoes',
    seed + 2,
  );

  if (shoes) {
    look.push(shoes);
  }

  for (const category of outfitCategories) {
    if (look.length >= 3) break;

    const candidate = pickFrom(
      items,
      category,
      seed + look.length,
    );

    if (
      candidate &&
      !look.some(
        (item) =>
          item.id === candidate.id,
      )
    ) {
      look.push(candidate);
    }
  }

  for (const candidate of items) {
    if (look.length >= 3) break;

    if (
      !look.some(
        (item) =>
          item.id === candidate.id,
      )
    ) {
      look.push(candidate);
    }
  }

  return look;
}

function openItem(id: string) {
  router.push({
    pathname: '/clothes',
    params: { id },
  });
}

export default function HomeScreen() {
  const { items } = useWardrobe();

  const [lookSeed, setLookSeed] =
    useState(0);

  const favoriteCount = items.filter(
    (item) => item.isFavorite,
  ).length;

  const recentItems = [...items]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    )
    .slice(0, 6);

  const quickLook = useMemo(
    () =>
      buildQuickLook(
        items,
        lookSeed,
      ),
    [items, lookSeed],
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView
        edges={['top']}
        style={styles.safeArea}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View
                style={styles.brandRow}
              >
                <Image
                  source={require(
                    '@/assets/images/online-wardrobe.png'
                  )}
                  style={styles.logo}
                />

                <View
                  style={
                    styles.brandText
                  }
                >
                  <Text
                    style={
                      styles.brandName
                    }
                  >
                    ONLINEWARDROBE
                  </Text>

                  <Text
                    style={
                      styles.greeting
                    }
                  >
                    Your online wardrobe,
                    always ready for your
                    next look.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View
                style={styles.statCard}
              >
                <Text
                  style={styles.statValue}
                >
                  {items.length}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  items in your closet
                </Text>
              </View>

              <View
                style={
                  styles.statDivider
                }
              />

              <View
                style={styles.statCard}
              >
                <Text
                  style={[
                    styles.statValue,
                    styles.favoriteValue,
                  ]}
                >
                  {favoriteCount}
                </Text>

                <Text
                  style={styles.statLabel}
                >
                  saved favorites
                </Text>
              </View>
            </View>

            {quickLook.length >= 2 && (
              <View
                style={styles.section}
              >
                <View
                  style={
                    styles.sectionHeadingRow
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      QUICK MATCH
                    </Text>

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      A look from your closet
                    </Text>
                  </View>

                  <Pressable
                    accessibilityLabel="Shuffle outfit"
                    accessibilityRole="button"
                    onPress={() =>
                      setLookSeed(
                        (value) =>
                          value + 1,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.shuffleButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.shuffleIcon
                      }
                    >
                      ↻
                    </Text>

                    <Text
                      style={
                        styles.shuffleText
                      }
                    >
                      Shuffle
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={styles.lookCard}
                >
                  {quickLook.map(
                    (item, index) => (
                      <Pressable
                        key={item.id}
                        accessibilityLabel={`Open ${item.name}`}
                        accessibilityRole="button"
                        onPress={() =>
                          openItem(
                            item.id,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.lookItem,
                          index > 0 &&
                            styles.lookItemOverlap,
                          pressed &&
                            styles.pressed,
                        ]}
                      >
                        <Image
                          source={{
                            uri: item.imageUri,
                          }}
                          style={
                            styles.lookImage
                          }
                          contentFit="cover"
                        />
                      </Pressable>
                    ),
                  )}

                  <View
                    style={
                      styles.lookCaption
                    }
                  >
                    <Text
                      style={
                        styles.lookCaptionTitle
                      }
                    >
                      Made from what you own
                    </Text>

                    <Text
                      style={
                        styles.lookCaptionBody
                      }
                    >
                      Tap any piece to view
                      it, or shuffle for
                      another combination.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {recentItems.length > 0 && (
              <View
                style={styles.section}
              >
                <View
                  style={
                    styles.sectionHeadingRow
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      YOUR CLOSET
                    </Text>

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Recently added
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      router.push(
                        '/closet',
                      )
                    }
                    hitSlop={8}
                  >
                    <Text
                      style={styles.seeAll}
                    >
                      See all
                    </Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.recentRow
                  }
                >
                  {recentItems.map(
                    (item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        onPress={() =>
                          openItem(
                            item.id,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.recentCard,
                          pressed &&
                            styles.pressed,
                        ]}
                      >
                        <Image
                          contentFit="cover"
                          source={{
                            uri: item.imageUri,
                          }}
                          style={
                            styles.recentImage
                          }
                        />

                        <Text
                          numberOfLines={1}
                          style={
                            styles.recentName
                          }
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      Palette.background,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom:
      Layout.tabClearance,
  },

  content: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal:
      Layout.gutter,
    paddingTop: 8,
    gap: 22,
  },

  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    flexShrink: 1,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 15,
  },

  brandText: {
    flex: 1,
    minWidth: 0,
  },

  brandName: {
    color: Palette.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  greeting: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  pressed: {
    opacity: 0.74,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  statsRow: {
    flexDirection: 'row',
    minHeight: 88,
    borderRadius:
      Radius.medium,
    backgroundColor:
      Palette.surface,
    borderWidth: 1,
    borderColor:
      Palette.border,
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  statCard: {
    flex: 1,
    gap: 3,
  },

  statDivider: {
    width: 1,
    height: 42,
    backgroundColor:
      Palette.border,
    marginHorizontal: 16,
  },

  statValue: {
    color: Palette.brand,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },

  favoriteValue: {
    color: Palette.coral,
  },

  statLabel: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  section: {
    gap: 14,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },

  sectionEyebrow: {
    color: Palette.brand,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  sectionTitle: {
    color: Palette.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
  },

  shuffleButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor:
      Palette.brandSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  shuffleIcon: {
    color: Palette.brand,
    fontSize: 18,
    fontWeight: '700',
  },

  shuffleText: {
    color: Palette.brand,
    fontSize: 13,
    fontWeight: '700',
  },

  lookCard: {
    minHeight: 200,
    padding: 16,
    borderRadius:
      Radius.large,
    backgroundColor:
      Palette.brandDark,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  lookItem: {
    width: 104,
    aspectRatio: 0.82,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor:
      Palette.brandDark,
    backgroundColor:
      Palette.surface,
  },

  lookItemOverlap: {
    marginLeft: -36,
  },

  lookImage: {
    width: '100%',
    height: '100%',
  },

  lookCaption: {
    flex: 1,
    minWidth: 165,
    paddingLeft: 16,
    gap: 6,
  },

  lookCaptionTitle: {
    color: Palette.white,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },

  lookCaptionBody: {
    color: '#CDE0DD',
    fontSize: 13,
    lineHeight: 19,
  },

  seeAll: {
    color: Palette.brand,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },

  recentRow: {
    gap: 12,
    paddingRight: 4,
  },

  recentCard: {
    width: 148,
    borderRadius:
      Radius.medium,
    overflow: 'hidden',
    backgroundColor:
      Palette.surface,
    borderWidth: 1,
    borderColor:
      Palette.border,
  },

  recentImage: {
    width: '100%',
    aspectRatio: 0.88,
    backgroundColor:
      Palette.lavender,
  },

  recentName: {
    color: Palette.ink,
    fontSize: 13,
    fontWeight: '600',
    padding: 11,
  },
});