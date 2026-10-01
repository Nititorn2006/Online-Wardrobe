import { act, render, waitFor } from '@testing-library/react-native';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { type ReactNode, useEffect } from 'react';

import {
  persistWardrobeImage,
  removeWardrobeImage,
} from '../image-store';
import {
  loadSavedOutfits,
  saveSavedOutfits,
} from '../../outfits/storage';
import type {
  OutfitOccasion,
  SavedOutfit,
  SaveOutfitInput,
} from '../../outfits/types';
import {
  loadWardrobeItems,
  saveWardrobeItems,
} from '../storage';
import type {
  AddClothingInput,
  ClothingCategory,
  ClothingFormality,
  ClothingItem,
  UpdateClothingDetailsInput,
} from '../types';
import {
  WardrobeProvider,
  type WardrobeContextValue,
  useWardrobe,
} from '../wardrobe-provider';

jest.mock('../image-store', () => ({
  persistWardrobeImage: jest.fn(),
  removeWardrobeImage: jest.fn(),
}));

jest.mock('../storage', () => ({
  loadWardrobeItems: jest.fn(),
  saveWardrobeItems: jest.fn(),
}));

jest.mock('../../outfits/storage', () => ({
  loadSavedOutfits: jest.fn(),
  saveSavedOutfits: jest.fn(),
}));

const mockPersistWardrobeImage = persistWardrobeImage as jest.MockedFunction<
  typeof persistWardrobeImage
>;
const mockRemoveWardrobeImage = removeWardrobeImage as jest.MockedFunction<
  typeof removeWardrobeImage
>;
const mockLoadWardrobeItems = loadWardrobeItems as jest.MockedFunction<
  typeof loadWardrobeItems
>;
const mockSaveWardrobeItems = saveWardrobeItems as jest.MockedFunction<
  typeof saveWardrobeItems
>;
const mockLoadSavedOutfits = loadSavedOutfits as jest.MockedFunction<
  typeof loadSavedOutfits
>;
const mockSaveSavedOutfits = saveSavedOutfits as jest.MockedFunction<
  typeof saveSavedOutfits
>;

function clothingItem(
  id: string,
  overrides: Partial<ClothingItem> = {},
): ClothingItem {
  return {
    id,
    name: id,
    category: 'tops',
    formality: 'casual',
    color: '#223344',
    imageUri: `file:///documents/wardrobe/${id}.jpg`,
    isFavorite: false,
    createdAt: '2026-09-30T08:00:00.000Z',
    ...overrides,
  };
}

function savedOutfit(
  id: string,
  itemIds: string[] = ['shirt', 'pants'],
): SavedOutfit {
  return {
    id,
    name: 'Casual everyday look',
    itemIds,
    formality: 'casual',
    occasion: 'everyday',
    plannedFor: '2026-10-01',
    createdAt: '2026-09-30T09:00:00.000Z',
  };
}

const validAddInput: AddClothingInput = {
  name: 'New jacket',
  category: 'outerwear',
  formality: 'smart-casual',
  color: '#AABBCC',
  sourceUri: 'file:///camera/new-jacket.JPG',
};

const validSaveInput: SaveOutfitInput = {
  itemIds: ['shirt', 'pants'],
  formality: 'casual',
  occasion: 'everyday',
  plannedFor: '2026-10-01',
};

let latestContext: WardrobeContextValue | null = null;

function ContextProbe() {
  const wardrobe = useWardrobe();

  useEffect(() => {
    latestContext = wardrobe;
  }, [wardrobe]);

  return null;
}

function ContextBoundary({ children }: { children: ReactNode }) {
  return <WardrobeProvider>{children}</WardrobeProvider>;
}

function context(): WardrobeContextValue {
  if (!latestContext) {
    throw new Error('The wardrobe context has not rendered.');
  }
  return latestContext;
}

async function mountHydrated(
  items: ClothingItem[] = [],
  outfits: SavedOutfit[] = [],
) {
  mockLoadWardrobeItems.mockResolvedValue(items);
  mockLoadSavedOutfits.mockResolvedValue(outfits);
  const view = await render(<ContextProbe />, { wrapper: ContextBoundary });

  await waitFor(() => expect(context().isHydrated).toBe(true));
  return view;
}

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

describe('WardrobeProvider', () => {
  beforeEach(() => {
    latestContext = null;
    jest.resetAllMocks();
    mockLoadWardrobeItems.mockResolvedValue([]);
    mockLoadSavedOutfits.mockResolvedValue([]);
    mockSaveWardrobeItems.mockResolvedValue(undefined);
    mockSaveSavedOutfits.mockResolvedValue(undefined);
    mockPersistWardrobeImage.mockResolvedValue(
      'file:///documents/wardrobe/new-item.jpg',
    );
    mockRemoveWardrobeImage.mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('requires useWardrobe consumers to be inside the provider', async () => {
    await expect(render(<ContextProbe />)).rejects.toThrow(
      'useWardrobe must be used within a WardrobeProvider.',
    );
  });

  test('hydrates data and completes the full wardrobe and outfit workflow', async () => {
    const shirt = clothingItem('shirt');
    const pants = clothingItem('pants', { category: 'bottoms' });
    const originalOutfit = savedOutfit('outfit-existing');
    await mountHydrated([shirt, pants], [originalOutfit]);

    expect(context()).toMatchObject({
      items: [shirt, pants],
      outfits: [originalOutfit],
      isHydrated: true,
    });

    let added!: ClothingItem;
    await act(async () => {
      added = await context().addItem({
        ...validAddInput,
        name: '  New jacket  ',
        color: '  #aabbcc ',
        sourceUri: '  file:///camera/new-jacket.JPG  ',
      });
    });

    expect(mockPersistWardrobeImage).toHaveBeenCalledWith(
      'file:///camera/new-jacket.JPG',
      expect.any(String),
    );
    expect(added).toMatchObject({
      name: 'New jacket',
      category: 'outerwear',
      formality: 'smart-casual',
      color: '#AABBCC',
      imageUri: 'file:///documents/wardrobe/new-item.jpg',
      isFavorite: false,
    });
    expect(context().items).toHaveLength(3);

    await act(async () => {
      await context().updateItemDetails(added.id, {
        category: 'dresses',
        formality: 'formal',
        color: '#abcdef',
      });
    });
    expect(context().items.find((item) => item.id === added.id)).toMatchObject({
      category: 'dresses',
      formality: 'formal',
      color: '#ABCDEF',
    });

    await act(async () => {
      await context().toggleFavorite(added.id);
    });
    expect(context().items.find((item) => item.id === added.id)?.isFavorite).toBe(
      true,
    );

    let createdOutfit!: SavedOutfit;
    await act(async () => {
      createdOutfit = await context().saveOutfit({
        ...validSaveInput,
        itemIds: ['shirt', 'pants', 'shirt'],
      });
    });
    expect(createdOutfit).toMatchObject({
      name: 'Casual everyday look',
      itemIds: ['shirt', 'pants'],
      formality: 'casual',
      occasion: 'everyday',
      plannedFor: '2026-10-01',
    });
    expect(context().outfits).toHaveLength(2);

    await act(async () => {
      await context().deleteOutfit(createdOutfit.id);
    });
    expect(context().outfits).toEqual([originalOutfit]);

    await act(async () => {
      await context().deleteItem(added.id);
    });
    expect(context().items.map((item) => item.id)).toEqual(['shirt', 'pants']);
    expect(mockRemoveWardrobeImage).toHaveBeenCalledWith(added.imageUri);
    expect(mockSaveWardrobeItems).toHaveBeenCalled();
    expect(mockSaveSavedOutfits).toHaveBeenCalled();
  });

  test('logs independent hydration failures and still becomes ready', async () => {
    const wardrobeFailure = new Error('wardrobe load failed');
    const outfitFailure = new Error('outfit load failed');
    mockLoadWardrobeItems.mockRejectedValue(wardrobeFailure);
    mockLoadSavedOutfits.mockRejectedValue(outfitFailure);

    await render(<ContextProbe />, { wrapper: ContextBoundary });

    await waitFor(() => expect(context().isHydrated).toBe(true));
    expect(console.error).toHaveBeenCalledWith(wardrobeFailure);
    expect(console.error).toHaveBeenCalledWith(outfitFailure);
    expect(context().items).toEqual([]);
    expect(context().outfits).toEqual([]);
  });

  test('does not publish hydration results after unmounting', async () => {
    const wardrobeLoad = deferred<ClothingItem[]>();
    const outfitLoad = deferred<SavedOutfit[]>();
    mockLoadWardrobeItems.mockReturnValue(wardrobeLoad.promise);
    mockLoadSavedOutfits.mockReturnValue(outfitLoad.promise);
    const view = await render(<ContextProbe />, { wrapper: ContextBoundary });

    expect(context().isHydrated).toBe(false);
    await view.unmount();
    wardrobeLoad.resolve([clothingItem('late-item')]);
    outfitLoad.resolve([savedOutfit('late-outfit')]);

    await act(async () => {
      await Promise.all([wardrobeLoad.promise, outfitLoad.promise]);
      await Promise.resolve();
    });
  });

  test('rejects every mutation while hydration is pending', async () => {
    const wardrobeLoad = deferred<ClothingItem[]>();
    const outfitLoad = deferred<SavedOutfit[]>();
    mockLoadWardrobeItems.mockReturnValue(wardrobeLoad.promise);
    mockLoadSavedOutfits.mockReturnValue(outfitLoad.promise);
    const view = await render(<ContextProbe />, { wrapper: ContextBoundary });
    const loadingMessage =
      'Your wardrobe is still loading. Please try again in a moment.';

    const operations = [
      context().addItem(validAddInput),
      context().updateItemDetails('shirt', {
        category: 'tops',
        formality: 'casual',
        color: '#112233',
      }),
      context().toggleFavorite('shirt'),
      context().saveOutfit(validSaveInput),
      context().deleteOutfit('outfit-1'),
      context().deleteItem('shirt'),
    ];

    await Promise.all(
      operations.map((operation) =>
        expect(operation).rejects.toThrow(loadingMessage),
      ),
    );

    await view.unmount();
    wardrobeLoad.resolve([]);
    outfitLoad.resolve([]);
    await act(async () => {
      await Promise.all([wardrobeLoad.promise, outfitLoad.promise]);
      await Promise.resolve();
    });
  });

  test.each([
    ['a blank name', { ...validAddInput, name: '  ' }, 'Please enter a name'],
    [
      'an invalid category',
      { ...validAddInput, category: 'pets' as ClothingCategory },
      'Please choose a valid clothing category',
    ],
    [
      'an invalid dress code',
      { ...validAddInput, formality: 'costume' as ClothingFormality },
      'Please choose a valid dress code',
    ],
    [
      'an invalid color',
      { ...validAddInput, color: 'red' },
      'Please choose a color',
    ],
    [
      'a blank source URI',
      { ...validAddInput, sourceUri: '   ' },
      'Please choose a clothing photo',
    ],
  ])('rejects add input with %s', async (_label, input, message) => {
    await mountHydrated();

    await expect(context().addItem(input)).rejects.toThrow(message);
    expect(mockPersistWardrobeImage).not.toHaveBeenCalled();
  });

  test('removes a copied image when saving the new wardrobe fails', async () => {
    const failure = new Error('save failed');
    await mountHydrated();
    mockSaveWardrobeItems.mockRejectedValueOnce(failure);

    await expect(context().addItem(validAddInput)).rejects.toBe(failure);
    expect(mockRemoveWardrobeImage).toHaveBeenCalledWith(
      'file:///documents/wardrobe/new-item.jpg',
    );
  });

  test('keeps the save failure when copied-image cleanup also fails', async () => {
    const saveFailure = new Error('save failed');
    const cleanupFailure = new Error('cleanup failed');
    await mountHydrated();
    mockSaveWardrobeItems.mockRejectedValueOnce(saveFailure);
    mockRemoveWardrobeImage.mockRejectedValueOnce(cleanupFailure);

    await expect(context().addItem(validAddInput)).rejects.toBe(saveFailure);
    expect(console.warn).toHaveBeenCalledWith(cleanupFailure);
  });

  test.each([
    [
      'category',
      { category: 'pets' as ClothingCategory, formality: 'casual', color: '#112233' },
      'Please choose a valid clothing category',
    ],
    [
      'dress code',
      { category: 'tops', formality: 'costume' as ClothingFormality, color: '#112233' },
      'Please choose a valid dress code',
    ],
    [
      'color',
      { category: 'tops', formality: 'casual', color: 'blue' },
      'Please choose a valid color',
    ],
  ])(
    'rejects an invalid updated %s',
    async (_label, input, message) => {
      await mountHydrated([clothingItem('shirt')]);

      await expect(
        context().updateItemDetails(
          'shirt',
          input as UpdateClothingDetailsInput,
        ),
      ).rejects.toThrow(message);
    },
  );

  test('rejects updates and favorite changes for missing items', async () => {
    await mountHydrated([clothingItem('shirt')]);

    await expect(
      context().updateItemDetails('missing', {
        category: 'tops',
        formality: 'casual',
        color: '#112233',
      }),
    ).rejects.toThrow('This clothing item could not be found.');
    await expect(context().toggleFavorite('missing')).rejects.toThrow(
      'This clothing item could not be found.',
    );
  });

  test.each([
    [
      'too few unique items',
      { ...validSaveInput, itemIds: ['shirt', 'shirt'] },
      'Choose at least two clothing items',
    ],
    [
      'a missing item',
      { ...validSaveInput, itemIds: ['shirt', 'missing'] },
      'One or more pieces in this outfit are no longer in your closet',
    ],
    [
      'an invalid dress code',
      { ...validSaveInput, formality: 'costume' as ClothingFormality },
      'Please choose a valid dress code',
    ],
    [
      'an invalid occasion',
      { ...validSaveInput, occasion: 'gym' as OutfitOccasion },
      'Please choose a valid occasion',
    ],
    [
      'an invalid date',
      { ...validSaveInput, plannedFor: '2026-02-30' },
      'Please choose a valid date',
    ],
  ])('rejects an outfit with %s', async (_label, input, message) => {
    await mountHydrated([
      clothingItem('shirt'),
      clothingItem('pants', { category: 'bottoms' }),
    ]);

    await expect(context().saveOutfit(input)).rejects.toThrow(message);
  });

  test('rejects deletion of missing outfits and clothing items', async () => {
    await mountHydrated(
      [clothingItem('shirt')],
      [savedOutfit('outfit-existing')],
    );

    await expect(context().deleteOutfit('missing')).rejects.toThrow(
      'This saved outfit could not be found.',
    );
    await expect(context().deleteItem('missing')).rejects.toThrow(
      'This clothing item could not be found.',
    );
  });

  test('finishes deleting an item when image cleanup fails', async () => {
    const cleanupFailure = new Error('cleanup failed');
    await mountHydrated(
      [
        clothingItem('shirt'),
        clothingItem('pants', { category: 'bottoms' }),
      ],
      [savedOutfit('outfit-existing')],
    );
    mockRemoveWardrobeImage.mockRejectedValueOnce(cleanupFailure);

    await act(async () => {
      await context().deleteItem('shirt');
    });

    expect(context().items.map((item) => item.id)).toEqual(['pants']);
    expect(context().outfits).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(cleanupFailure);
  });
});
