import { describe, expect, test } from '@jest/globals';

import { isDateValue, normalizeSavedOutfit } from '../outfit-schema';

const validOutfit = {
  id: 'outfit-1',
  name: 'Casual everyday look',
  itemIds: ['top', 'bottom'],
  formality: 'casual',
  occasion: 'everyday',
  plannedFor: '2026-10-01',
  createdAt: '2026-09-30T08:00:00.000Z',
};

describe('outfit schema', () => {
  test.each([
    ['a real calendar date', '2028-02-29', true],
    ['a non-string value', null, false],
    ['a malformed date', '2026/10/01', false],
    ['an impossible calendar date', '2026-02-30', false],
  ])('recognizes %s', (_description, value, expected) => {
    expect(isDateValue(value)).toBe(expected);
  });

  test('normalizes IDs while preserving a valid saved outfit', () => {
    expect(
      normalizeSavedOutfit({
        ...validOutfit,
        itemIds: ['top', '', 42, 'bottom', 'top'],
      }),
    ).toEqual(validOutfit);
  });

  test('rejects non-record and non-array payloads', () => {
    expect(normalizeSavedOutfit(null)).toBeNull();
    expect(
      normalizeSavedOutfit({
        ...validOutfit,
        itemIds: 'top,bottom',
      }),
    ).toBeNull();
  });

  test.each([
    ['non-string ID', { id: 1 }],
    ['empty ID', { id: '' }],
    ['non-string name', { name: 1 }],
    ['empty name', { name: '' }],
    ['too few item IDs', { itemIds: ['top'] }],
    ['invalid formality', { formality: 'costume' }],
    ['invalid occasion', { occasion: 'moonwalk' }],
    ['invalid planned date', { plannedFor: '2026-02-30' }],
    ['non-string creation date', { createdAt: 1 }],
    ['unparseable creation date', { createdAt: 'not-a-date' }],
  ])('rejects an outfit with an %s', (_description, override) => {
    expect(normalizeSavedOutfit({ ...validOutfit, ...override })).toBeNull();
  });
});
