import { describe, expect, test } from '@jest/globals';

import type { ClothingItem } from '../../wardrobe/types';
import {
  buildSlotPools,
  canShuffle,
  createMixMatchDraft,
  createMixMatchSignature,
  cycleSlot,
  getMixMatchReadiness,
  getSelectedItemIds,
  getSuggestedFormality,
  reconcileMixMatchDraft,
  shuffleUnlocked,
  toggleSlotLock,
} from '../mix-match';

function item(
  id: string,
  category: ClothingItem['category'],
  overrides: Partial<ClothingItem> = {},
): ClothingItem {
  return {
    id,
    name: id,
    category,
    formality: 'casual',
    color: '#222222',
    imageUri: `file:///${id}.jpg`,
    isFavorite: false,
    createdAt: '2026-09-30T08:00:00.000Z',
    ...overrides,
  };
}

const wardrobe = [
  item('top-a', 'tops', { isFavorite: true }),
  item('top-b', 'tops'),
  item('bottom-a', 'bottoms'),
  item('bottom-b', 'bottoms'),
  item('dress', 'dresses'),
  item('shoes', 'shoes'),
  item('jacket', 'outerwear'),
];

describe('mix and match outfit board', () => {
  test('builds stable pools and starts with a complete separates look', () => {
    const pools = buildSlotPools(wardrobe);
    const draft = createMixMatchDraft(wardrobe);

    expect(pools.top.map((candidate) => candidate.id)).toEqual(['top-a', 'top-b']);
    expect(draft.mode).toBe('separates');
    expect(getSelectedItemIds(draft)).toEqual(['top-a', 'bottom-a', 'shoes']);
    expect(getMixMatchReadiness(draft).canSave).toBe(true);
  });

  test('sorts pools by favorite, recency, then stable ID', () => {
    const pools = buildSlotPools([
      item('z-old', 'tops', { createdAt: '2026-09-28T08:00:00.000Z' }),
      item('b-new', 'tops', { createdAt: '2026-09-30T08:00:00.000Z' }),
      item('a-new', 'tops', { createdAt: '2026-09-30T08:00:00.000Z' }),
      item('favorite', 'tops', {
        createdAt: '2026-09-27T08:00:00.000Z',
        isFavorite: true,
      }),
    ]);

    expect(pools.top.map((candidate) => candidate.id)).toEqual([
      'favorite',
      'a-new',
      'b-new',
      'z-old',
    ]);
  });

  test('uses an incoming dress look without filling hidden slots', () => {
    const draft = createMixMatchDraft(wardrobe, ['missing', 'dress', 'shoes']);

    expect(draft.mode).toBe('dress');
    expect(getSelectedItemIds(draft)).toEqual(['dress', 'shoes']);
    expect(draft.selected.top).toBeNull();
  });

  test('initializes dress-only, partial, and empty wardrobes safely', () => {
    const dressOnly = createMixMatchDraft([item('dress-only', 'dresses')]);
    const bottomOnly = createMixMatchDraft(
      [item('bottom-only', 'bottoms')],
      ['bottom-only'],
    );
    const empty = createMixMatchDraft([]);

    expect(dressOnly.mode).toBe('dress');
    expect(dressOnly.selected.dress).toBe('dress-only');
    expect(dressOnly.selected.shoes).toBeNull();
    expect(bottomOnly.mode).toBe('separates');
    expect(bottomOnly.selected.bottom).toBe('bottom-only');
    expect(empty.mode).toBe('separates');
    expect(empty.selected.top).toBeNull();
  });

  test('cycles slots in both directions and wraps around', () => {
    const pools = buildSlotPools(wardrobe);
    const draft = createMixMatchDraft(wardrobe);
    const next = cycleSlot(draft, 'top', 1, pools);
    const wrapped = cycleSlot(draft, 'top', -1, pools);

    expect(next.selected.top).toBe('top-b');
    expect(wrapped.selected.top).toBe('top-b');
  });

  test('optional slots include a None state', () => {
    const pools = buildSlotPools(wardrobe);
    const draft = createMixMatchDraft(wardrobe);
    const next = cycleSlot(draft, 'outerwear', 1, pools);
    const noneAgain = cycleSlot(next, 'outerwear', 1, pools);

    expect(next.selected.outerwear).toBe('jacket');
    expect(noneAgain.selected.outerwear).toBeNull();
  });

  test('shuffle changes every unlocked slot that has an alternative', () => {
    const pools = buildSlotPools(wardrobe);
    const draft = createMixMatchDraft(wardrobe);
    const next = shuffleUnlocked(draft, pools);

    expect(next.selected.top).not.toBe(draft.selected.top);
    expect(next.selected.bottom).not.toBe(draft.selected.bottom);
    expect(next.selected.outerwear).not.toBe(draft.selected.outerwear);
  });

  test('shuffle preserves locked slots', () => {
    const pools = buildSlotPools(wardrobe);
    const draft = toggleSlotLock(createMixMatchDraft(wardrobe), 'top');
    const next = shuffleUnlocked(draft, pools);

    expect(next.selected.top).toBe(draft.selected.top);
    expect(next.selected.bottom).not.toBe(draft.selected.bottom);
  });

  test('reports when nothing can be shuffled', () => {
    const singleLook = [item('top', 'tops'), item('bottom', 'bottoms')];
    const draft = createMixMatchDraft(singleLook);

    expect(canShuffle(draft, buildSlotPools(singleLook))).toBe(false);
  });

  test('can select a newly added piece after an empty required slot', () => {
    const incompleteLook = [item('top', 'tops')];
    const draft = createMixMatchDraft(incompleteLook);
    const withBottom = [...incompleteLook, item('bottom', 'bottoms')];
    const pools = buildSlotPools(withBottom);

    expect(draft.selected.bottom).toBeNull();
    expect(canShuffle(draft, pools)).toBe(true);
    expect(cycleSlot(draft, 'bottom', 1, pools).selected.bottom).toBe('bottom');
    expect(cycleSlot(draft, 'bottom', -1, pools).selected.bottom).toBe('bottom');
  });

  test('reconciles removed items and unlocks their slots', () => {
    const draft = toggleSlotLock(createMixMatchDraft(wardrobe), 'top');
    const withoutTops = wardrobe.filter((candidate) => candidate.category !== 'tops');
    const reconciled = reconcileMixMatchDraft(draft, buildSlotPools(withoutTops));

    expect(reconciled.selected.top).toBeNull();
    expect(reconciled.locked.top).toBe(false);
    expect(getMixMatchReadiness(reconciled).canSave).toBe(false);
  });

  test('reports dress and persistence readiness states', () => {
    const emptyDress = { ...createMixMatchDraft([]), mode: 'dress' as const };
    const oneDress = createMixMatchDraft([item('dress-only', 'dresses')]);

    expect(getMixMatchReadiness(emptyDress)).toEqual({
      canSave: false,
      message: 'Choose a dress to complete the main look.',
    });
    expect(getMixMatchReadiness(oneDress)).toEqual({
      canSave: false,
      message: 'Add shoes, outerwear, or an accessory before saving this outfit.',
    });
  });

  test('suggests the most common selected dress code and ignores stale IDs', () => {
    const items = [
      item('casual', 'tops', { formality: 'casual' }),
      item('formal-a', 'bottoms', { formality: 'formal' }),
      item('formal-b', 'shoes', { formality: 'formal' }),
    ];

    expect(getSuggestedFormality(items, [])).toBe('casual');
    expect(
      getSuggestedFormality(items, ['stale', 'casual', 'formal-a', 'formal-b']),
    ).toBe('formal');
  });

  test('signature changes with mode, items, or save details', () => {
    const draft = createMixMatchDraft(wardrobe);
    const details = {
      occasion: 'everyday' as const,
      formality: 'casual' as const,
      plannedFor: '2026-09-30',
    };
    const first = createMixMatchSignature(draft, details);
    const changedItem = createMixMatchSignature(
      cycleSlot(draft, 'top', 1, buildSlotPools(wardrobe)),
      details,
    );
    const changedDate = createMixMatchSignature(draft, {
      ...details,
      plannedFor: '2026-10-01',
    });

    expect(changedItem).not.toBe(first);
    expect(changedDate).not.toBe(first);
  });
});
