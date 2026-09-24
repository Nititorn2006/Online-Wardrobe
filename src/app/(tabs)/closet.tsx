import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClothingCard } from '@/components/wardrobe/clothing-card';
import { EmptyCloset } from '@/components/wardrobe/empty-closet';
import { Layout, Palette, Radius } from '@/constants/design';
import {
  CATEGORIES,
  type ClothingCategory,
  type ClothingItem,
} from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

type CollectionFilter = 'all' | 'favorites';

export default function ClosetScreen() {
  const { items, toggleFavorite } = useWardrobe();

  const [collection, setCollection] =
    useState<CollectionFilter>('all');

  const [category, setCategory] =
    useState<ClothingCategory | 'all'>('all');

  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase();

    return [...items]
      .filter(
        (item) =>
          collection === 'all' || item.isFavorite,
      )
      .filter(
        (item) =>
          category === 'all' ||
          item.category === category,
      )
      .filter(
        (item) =>
          !normalizedQuery ||
          item.name
            .toLocaleLowerCase()
            .includes(normalizedQuery),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [category, collection, items, query]);

  const emptyCopy = getEmptyCopy({
    hasItems: items.length > 0,
    collection,
    category,
    query,
  });

  const openItem = (item: ClothingItem) => {
    router.push({
      pathname: '/clothes',
      params: {
        id: item.id,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView
        edges={['top']}
        style={styles.safeArea}
      >
        <FlatList
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          data={filteredItems}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <View style={styles.titleCopy}>
                  <Text style={styles.eyebrow}>
                    YOUR WARDROBE
                  </Text>

                  <Text style={styles.title}>
                    My Clothes
                  </Text>

                  <Text style={styles.subtitle}>
                    {items.length}{' '}
                    {items.length === 1
                      ? 'piece'
                      : 'pieces'}{' '}
                    ready to style
                  </Text>
                </View>
              </View>

              <View style={styles.searchBox}>
                <Text
                  importantForAccessibility="no"
                  style={styles.searchIcon}
                >
                  ⌕
                </Text>

                <TextInput
                  accessibilityLabel="Search your clothes"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setQuery}
                  placeholder="Search your clothes"
                  placeholderTextColor="#9BA19E"
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={query}
                />

                {query.length > 0 && (
                  <Pressable
                    accessibilityLabel="Clear search"
                    hitSlop={8}
                    onPress={() => setQuery('')}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearText}>
                      ×
                    </Text>
                  </Pressable>
                )}
              </View>

              <View
                accessibilityRole="tablist"
                style={styles.segmentedControl}
              >
                <CollectionTab
                  isSelected={collection === 'all'}
                  label="All clothes"
                  onPress={() =>
                    setCollection('all')
                  }
                />

                <CollectionTab
                  isSelected={
                    collection === 'favorites'
                  }
                  label="Favorites"
                  onPress={() =>
                    setCollection('favorites')
                  }
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  styles.categoryRow
                }
              >
                <CategoryChip
                  isSelected={category === 'all'}
                  label="All"
                  onPress={() => setCategory('all')}
                />

                {CATEGORIES.map((option) => (
                  <CategoryChip
                    key={option.value}
                    isSelected={
                      category === option.value
                    }
                    label={option.label}
                    onPress={() =>
                      setCategory(option.value)
                    }
                  />
                ))}
              </ScrollView>

              {filteredItems.length > 0 && (
                <View style={styles.resultsRow}>
                  <Text style={styles.resultsLabel}>
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1
                      ? 'item'
                      : 'items'}
                  </Text>

                  {(collection !== 'all' ||
                    category !== 'all' ||
                    query) && (
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        setCollection('all');
                        setCategory('all');
                        setQuery('');
                      }}
                    >
                      <Text
                        style={styles.resetText}
                      >
                        Reset filters
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyCloset
                body={emptyCopy.body}
                buttonLabel={
                  items.length
                    ? undefined
                    : 'Add your first item'
                }
                onButtonPress={
                  items.length
                    ? undefined
                    : () =>
                        router.push(
                          '/add-clothes',
                        )
                }
                title={emptyCopy.title}
              />

              {items.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setCollection('all');
                    setCategory('all');
                    setQuery('');
                  }}
                  style={({ pressed }) => [
                    styles.resetButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.resetButtonText
                    }
                  >
                    Clear filters
                  </Text>
                </Pressable>
              )}
            </View>
          }
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.cardSlot}>
              <ClothingCard
                item={item}
                onPress={() => openItem(item)}
                onToggleFavorite={() =>
                  void toggleFavorite(item.id)
                }
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

function CollectionTab({
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
      accessibilityRole="tab"
      accessibilityState={{
        selected: isSelected,
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        isSelected && styles.segmentSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          isSelected &&
            styles.segmentTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CategoryChip({
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
      accessibilityState={{
        selected: isSelected,
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryChip,
        isSelected &&
          styles.categoryChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.categoryText,
          isSelected &&
            styles.categoryTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getEmptyCopy({
  hasItems,
  collection,
  category,
  query,
}: {
  hasItems: boolean;
  collection: CollectionFilter;
  category: ClothingCategory | 'all';
  query: string;
}) {
  if (!hasItems) {
    return {
      title: 'Your closet is waiting',
      body:
        'Photograph your favorite pieces and keep your whole wardrobe in one beautiful place.',
    };
  }

  if (query.trim()) {
    return {
      title: 'No matching pieces',
      body: `We couldn’t find anything named “${query.trim()}”. Try another search or clear the filters.`,
    };
  }

  if (collection === 'favorites') {
    return {
      title: 'No favorites yet',
      body:
        'Tap the heart on pieces you reach for most, and they’ll gather here.',
    };
  }

  if (category !== 'all') {
    return {
      title: 'Nothing in this category',
      body:
        'Choose another category or add a new piece to this part of your wardrobe.',
    };
  }

  return {
    title: 'No pieces found',
    body:
      'Try clearing your filters to see everything in your closet.',
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },

  safeArea: {
    flex: 1,
  },

  listContent: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.gutter,
    paddingBottom: Layout.tabClearance,
  },

  gridRow: {
    gap: 12,
    marginBottom: 14,
  },

  cardSlot: {
    flex: 1,
    minWidth: 0,
    maxWidth: '49%',
  },

  headerContent: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 18,
  },

  titleRow: {
    alignItems: 'flex-start',
  },

  titleCopy: {
    width: '100%',
  },

  eyebrow: {
    color: Palette.brand,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 2,
  },

  title: {
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1.1,
  },

  subtitle: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
  },

  searchIcon: {
    color: Palette.muted,
    fontSize: 25,
    lineHeight: 27,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: Palette.ink,
    fontSize: 15,
    paddingVertical: 12,
  },

  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    color: Palette.muted,
    fontSize: 24,
    lineHeight: 25,
  },

  segmentedControl: {
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    borderRadius: Radius.medium,
    backgroundColor: '#EAE8E3',
  },

  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentSelected: {
    backgroundColor: Palette.surface,
  },

  segmentText: {
    color: Palette.muted,
    fontSize: 14,
    fontWeight: '600',
  },

  segmentTextSelected: {
    color: Palette.ink,
  },

  categoryRow: {
    gap: 8,
    paddingRight: 4,
  },

  categoryChip: {
    minHeight: 40,
    paddingHorizontal: 15,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryChipSelected: {
    backgroundColor: Palette.brand,
    borderColor: Palette.brand,
  },

  categoryText: {
    color: Palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  categoryTextSelected: {
    color: Palette.white,
  },

  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultsLabel: {
    color: Palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },

  resetText: {
    color: Palette.brand,
    fontSize: 13,
    fontWeight: '700',
  },

  emptyWrap: {
    gap: 16,
    paddingBottom: 20,
  },

  resetButton: {
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetButtonText: {
    color: Palette.brand,
    fontSize: 14,
    fontWeight: '700',
  },
});