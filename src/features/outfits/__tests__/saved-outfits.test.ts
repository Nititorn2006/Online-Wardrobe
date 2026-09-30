import { describe, expect, test } from '@jest/globals';

import { normalizeSavedOutfit } from '../outfit-schema';
import {
  buildOutfitName,
  removeItemFromSavedOutfits,
  sortSavedOutfits,
} from '../saved-outfit-utils';
import type { SavedOutfit } from '../types';

function outfit(overrides: Partial<SavedOutfit> = {}): SavedOutfit {
  return {
    id: 'outfit-1',
    name: 'Casual everyday look',
    itemIds: ['top', 'bottom'],
    formality: 'casual',
    occasion: 'everyday',
    plannedFor: '2026-10-01',
    createdAt: '2026-09-30T08:00:00.000Z',
    ...overrides,
  };
}

describe('saved outfits', () => {
  test('normalizes a valid outfit and removes duplicate item IDs', () => {
    expect(
      normalizeSavedOutfit(
        outfit({ itemIds: ['top', 'bottom', 'top'] }),
      )?.itemIds,
    ).toEqual(['top', 'bottom']);
  });

  test('rejects an outfit with fewer than two pieces', () => {
    expect(normalizeSavedOutfit(outfit({ itemIds: ['top'] }))).toBeNull();
  });

  test('builds a readable automatic name', () => {
    expect(buildOutfitName('smart-casual', 'work')).toBe(
      'Smart casual work / school look',
    );
  });

  test('removes a deleted item and drops incomplete outfits', () => {
    const kept = outfit({ id: 'kept', itemIds: ['top', 'bottom', 'shoes'] });
    const dropped = outfit({ id: 'dropped', itemIds: ['top', 'bottom'] });

    expect(removeItemFromSavedOutfits([kept, dropped], 'top')).toEqual([
      { ...kept, itemIds: ['bottom', 'shoes'] },
    ]);
  });

  test('sorts upcoming plans first and newest past plans afterward', () => {
    const upcomingLater = outfit({ id: 'later', plannedFor: '2026-10-03' });
    const upcomingSoon = outfit({ id: 'soon', plannedFor: '2026-10-01' });
    const past = outfit({
      id: 'past',
      plannedFor: '2026-09-20',
      createdAt: '2026-09-30T09:00:00.000Z',
    });

    expect(
      sortSavedOutfits([upcomingLater, past, upcomingSoon], '2026-09-30').map(
        (candidate) => candidate.id,
      ),
    ).toEqual(['soon', 'later', 'past']);
  });
});
