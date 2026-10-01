import { describe, expect, test } from '@jest/globals';

import type { ClothingItem } from '../../wardrobe/types';
import { recommendOutfit } from '../recommendation';

function item(
  id: string,
  category: ClothingItem['category'],
  formality: ClothingItem['formality'] = 'casual',
  isFavorite = false,
): ClothingItem {
  return {
    id,
    name: id,
    category,
    formality,
    color: '#222222',
    imageUri: `file:///${id}.jpg`,
    isFavorite,
    createdAt: '2026-09-30T08:00:00.000Z',
  };
}

const baseRequest = {
  formality: 'casual' as const,
  occasion: 'everyday' as const,
  plannedFor: '2026-09-30',
  seed: 0,
};

describe('recommendOutfit', () => {
  test('builds an everyday look from separates and shoes', () => {
    const result = recommendOutfit(
      [item('top', 'tops'), item('bottom', 'bottoms'), item('shoes', 'shoes')],
      baseRequest,
    );

    expect(result.isComplete).toBe(true);
    expect(result.items.map((piece) => piece.id)).toEqual([
      'top',
      'bottom',
      'shoes',
    ]);
  });

  test('prefers a dress for a wedding', () => {
    const result = recommendOutfit(
      [
        item('dress', 'dresses', 'formal'),
        item('top', 'tops', 'formal'),
        item('bottom', 'bottoms', 'formal'),
        item('shoes', 'shoes', 'formal'),
        item('accessory', 'accessories', 'formal'),
      ],
      {
        ...baseRequest,
        formality: 'formal',
        occasion: 'wedding',
      },
    );

    expect(result.items.map((piece) => piece.id)).toContain('dress');
    expect(result.items.map((piece) => piece.id)).not.toContain('top');
    expect(result.isComplete).toBe(true);
  });

  test('chooses an exact dress-code match before a mismatch', () => {
    const result = recommendOutfit(
      [
        item('casual-top', 'tops'),
        item('formal-top', 'tops', 'formal'),
        item('formal-bottom', 'bottoms', 'formal'),
      ],
      {
        ...baseRequest,
        formality: 'formal',
      },
    );

    expect(result.items.map((piece) => piece.id)).toContain('formal-top');
    expect(result.items.map((piece) => piece.id)).not.toContain('casual-top');
  });

  test('uses the seed to rotate equally suitable pieces', () => {
    const wardrobe = [
      item('top-a', 'tops'),
      item('top-b', 'tops'),
      item('bottom', 'bottoms'),
    ];

    const first = recommendOutfit(wardrobe, baseRequest);
    const next = recommendOutfit(wardrobe, { ...baseRequest, seed: 1 });

    expect(first.items[0].id).not.toBe(next.items[0].id);
    expect(new Set(next.items.map((piece) => piece.id)).size).toBe(next.items.length);
    expect(first.tryAnotherLabel).toBe('Change top');
    expect(first.variationMessage).toContain('Only the top');
  });

  test('ranks favorites first regardless of their original order', () => {
    const result = recommendOutfit(
      [
        item('plain-top', 'tops'),
        item('favorite-top', 'tops', 'casual', true),
        item('favorite-bottom', 'bottoms', 'casual', true),
        item('plain-bottom', 'bottoms'),
      ],
      baseRequest,
    );

    expect(result.items.map((piece) => piece.id)).toEqual([
      'favorite-top',
      'favorite-bottom',
    ]);
  });

  test('falls back to the nearest tier when no item is within one level', () => {
    const result = recommendOutfit(
      [
        item('relaxed-top', 'tops', 'relaxed'),
        item('relaxed-bottom', 'bottoms', 'relaxed'),
      ],
      { ...baseRequest, formality: 'black-tie' },
    );

    expect(result.items.map((piece) => piece.id)).toEqual([
      'relaxed-top',
      'relaxed-bottom',
    ]);
  });

  test('switches between separates and a dress when both are complete', () => {
    const wardrobe = [
      item('dress', 'dresses'),
      item('top', 'tops'),
      item('bottom', 'bottoms'),
      item('shoes', 'shoes'),
    ];

    const first = recommendOutfit(wardrobe, baseRequest);
    const next = recommendOutfit(wardrobe, { ...baseRequest, seed: 1 });

    expect(first.items.map((piece) => piece.category)).toEqual([
      'tops',
      'bottoms',
      'shoes',
    ]);
    expect(next.items.map((piece) => piece.category)).toEqual([
      'dresses',
      'shoes',
    ]);
    expect(first.canTryAnother).toBe(true);
  });

  test('supports the expanded black-tie dress code', () => {
    const result = recommendOutfit(
      [
        item('formal-top', 'tops', 'formal'),
        item('black-tie-top', 'tops', 'black-tie'),
        item('black-tie-bottom', 'bottoms', 'black-tie'),
      ],
      { ...baseRequest, formality: 'black-tie' },
    );

    expect(result.items.map((piece) => piece.id)).toContain('black-tie-top');
    expect(result.items.map((piece) => piece.id)).not.toContain('formal-top');
  });

  test.each([
    [
      'shoes',
      [item('dress', 'dresses'), item('shoes', 'shoes')],
      baseRequest,
    ],
    [
      'outerwear',
      [
        item('dress', 'dresses', 'business'),
        item('jacket', 'outerwear', 'business'),
      ],
      { ...baseRequest, formality: 'business' as const },
    ],
    [
      'an accessory',
      [item('dress', 'dresses'), item('bag', 'accessories')],
      { ...baseRequest, occasion: 'date' as const },
    ],
  ])('builds a complete dress look with %s', (_description, wardrobe, request) => {
    const result = recommendOutfit(wardrobe, request);

    expect(result.isComplete).toBe(true);
    expect(result.items[0].category).toBe('dresses');
    expect(result.items).toHaveLength(2);
  });

  test('disables Try Another when there is only one complete combination', () => {
    const result = recommendOutfit(
      [item('top', 'tops'), item('bottom', 'bottoms')],
      baseRequest,
    );

    expect(result.canTryAnother).toBe(false);
    expect(result.tryAnotherLabel).toBe('No other look yet');
    expect(result.variationMessage).toContain('only complete combination');
  });

  test('explains when the wardrobe cannot make a complete look', () => {
    const result = recommendOutfit([item('top', 'tops')], baseRequest);

    expect(result.isComplete).toBe(false);
    expect(result.missingMessage).toContain('dress');
  });

  test('explains when a dress still needs a companion piece', () => {
    const result = recommendOutfit([item('dress', 'dresses')], baseRequest);

    expect(result.isComplete).toBe(false);
    expect(result.missingMessage).toBe(
      'Add one more piece to turn this into a complete look.',
    );
  });
});
