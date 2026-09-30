import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Layout, Palette, Radius } from '@/constants/design';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

function openItem(id: string) {
  router.push({
    pathname: '/clothes',
    params: { id },
  });
}

export default function HomeScreen() {
  const { items } = useWardrobe();

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
                  <AppText
                    style={
                      styles.brandName
                    }
                  >
                    ONLINEWARDROBE
                  </AppText>

                  <AppText
                    style={
                      styles.greeting
                    }
                  >
                    Your online wardrobe,
                    always ready for your
                    next look.
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View
                style={styles.statCard}
              >
                <AppText
                  style={styles.statValue}
                >
                  {items.length}
                </AppText>

                <AppText
                  style={styles.statLabel}
                >
                  items in your closet
                </AppText>
              </View>

              <View
                style={
                  styles.statDivider
                }
              />

              <View
                style={styles.statCard}
              >
                <AppText
                  style={[
                    styles.statValue,
                    styles.favoriteValue,
                  ]}
                >
                  {favoriteCount}
                </AppText>

                <AppText
                  style={styles.statLabel}
                >
                  saved favorites
                </AppText>
              </View>
            </View>

            <Pressable
              accessibilityHint="Choose an occasion, dress code, and date"
              accessibilityLabel="Plan an outfit"
              accessibilityRole="button"
              onPress={() =>
                router.push(
                  '/recommend-outfit' as Href,
                )
              }
              style={({ pressed }) => [
                styles.plannerCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.plannerIcon}>
                <AppText style={styles.plannerIconText}>
                  ✦
                </AppText>
              </View>

              <View style={styles.plannerCopy}>
                <AppText style={styles.plannerEyebrow}>
                  OUTFIT PLANNER
                </AppText>
                <AppText style={styles.plannerTitle}>
                  Plan your next look
                </AppText>
                <AppText style={styles.plannerBody}>
                  Choose an occasion, dress code, and date to get a look from your closet.
                </AppText>
              </View>

              <View style={styles.plannerArrow}>
                <AppText style={styles.plannerArrowText}>→</AppText>
              </View>
            </Pressable>

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
                    <AppText
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      YOUR CLOSET
                    </AppText>

                    <AppText
                      style={
                        styles.sectionTitle
                      }
                    >
                      Recently added
                    </AppText>
                  </View>

                  <Pressable
                    onPress={() =>
                      router.push(
                        '/closet',
                      )
                    }
                    hitSlop={8}
                  >
                    <AppText
                      style={styles.seeAll}
                    >
                      See all
                    </AppText>
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

                        <AppText
                          numberOfLines={1}
                          style={
                            styles.recentName
                          }
                        >
                          {item.name}
                        </AppText>
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

  plannerCard: {
    minHeight: 154,
    padding: 18,
    borderRadius: Radius.large,
    backgroundColor: Palette.brandDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  plannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plannerIconText: {
    color: Palette.white,
    fontSize: 24,
  },

  plannerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  plannerEyebrow: {
    color: '#BDB8FF',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  plannerTitle: {
    color: Palette.white,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },

  plannerBody: {
    color: '#D7D4FF',
    fontSize: 12,
    lineHeight: 18,
  },

  plannerArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  plannerArrowText: {
    color: Palette.brand,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
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
