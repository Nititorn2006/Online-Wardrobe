import {
    describe,
    expect,
    test,
} from '@jest/globals';

import {
    getEmptyCopy,
} from '../src/features/wardrobe/closet-utils';

describe('getEmptyCopy', () => {
    test('returns empty wardrobe message', () => {
        expect(
            getEmptyCopy({
                hasItems: false,
                collection: 'all',
                category: 'all',
                query: '',
            }),
        ).toEqual({
            title: 'Your closet is waiting',
            body:
                'Photograph your favorite pieces and keep your whole wardrobe in one beautiful place.',
        });
    });

    test('returns search message', () => {
        const result = getEmptyCopy({
            hasItems: true,
            collection: 'all',
            category: 'all',
            query: '  shirt  ',
        });

        expect(result.title).toBe(
            'No matching pieces',
        );

        expect(result.body).toContain(
            'shirt',
        );
    });

    test('search has priority over favorite', () => {
        expect(
            getEmptyCopy({
                hasItems: true,
                collection: 'favorites',
                category: 'tops',
                query: 'shirt',
            }).title,
        ).toBe('No matching pieces');
    });

    test('returns favorites message', () => {
        expect(
            getEmptyCopy({
                hasItems: true,
                collection: 'favorites',
                category: 'all',
                query: '',
            }).title,
        ).toBe('No favorites yet');
    });

    test('favorites have priority over category', () => {
        expect(
            getEmptyCopy({
                hasItems: true,
                collection: 'favorites',
                category: 'tops',
                query: '',
            }).title,
        ).toBe('No favorites yet');
    });

    test('returns category message', () => {
        expect(
            getEmptyCopy({
                hasItems: true,
                collection: 'all',
                category: 'tops',
                query: '',
            }).title,
        ).toBe(
            'Nothing in this category',
        );
    });

    test('returns fallback', () => {
        expect(
            getEmptyCopy({
                hasItems: true,
                collection: 'all',
                category: 'all',
                query: '',
            }),
        ).toEqual({
            title: 'No pieces found',
            body:
                'Try clearing your filters to see everything in your closet.',
        });
    });
});