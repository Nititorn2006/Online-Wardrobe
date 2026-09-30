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
  });

  test('explains when the wardrobe cannot make a complete look', () => {
    const result = recommendOutfit([item('top', 'tops')], baseRequest);

    expect(result.isComplete).toBe(false);
    expect(result.missingMessage).toContain('dress');
  });
});
