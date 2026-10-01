import type {
    ClothingCategory,
} from './types';

export type CollectionFilter =
    | 'all'
    | 'favorites';

export function getEmptyCopy({
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
            body:
                `We couldn’t find anything named “${query.trim()}”. Try another search or clear the filters.`,
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