/* eslint-disable @typescript-eslint/no-require-imports */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TryOutfitsScreen from '../try-outfits';
import type { SavedOutfit, SaveOutfitInput } from '@/features/outfits/types';
import type { ClothingCategory, ClothingItem } from '@/features/wardrobe/types';
import { useWardrobe } from '@/features/wardrobe/wardrobe-provider';

type SearchParams = {
  itemIds?: string | string[];
  occasion?: string | string[];
  formality?: string | string[];
  importToken?: string | string[];
  plannedFor?: string | string[];
};

const mockParams: SearchParams = {};
const mockSaveOutfit = jest.fn<(input: SaveOutfitInput) => Promise<SavedOutfit>>();
const mockWardrobe: { items: ClothingItem[] } = { items: [] };

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  const React = mockJest.requireActual<typeof import('react')>('react');
  const { View } = mockJest.requireActual<typeof import('react-native')>('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => React.createElement(View, props),
    useSafeAreaInsets: mockJest.fn(),
  };
});

jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  const React = mockJest.requireActual<typeof import('react')>('react');
  const View = mockJest.requireActual<{ default: typeof import('react-native').View }>(
    'react-native/Libraries/Components/View/View',
  ).default;

  return {
    __esModule: true,
    default: ({ style, ...props }: { style?: unknown; [key: string]: unknown }) => {
      let resolvedStyle = style;
      if (typeof style === 'function') {
        resolvedStyle = style({ pressed: false });
        style({ pressed: true });
      }
      return React.createElement(
        View,
        { ...props, accessible: true, style: resolvedStyle } as never,
      );
    },
  };
});

jest.mock('expo-image', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  const React = mockJest.requireActual<typeof import('react')>('react');
  const { View } = mockJest.requireActual<typeof import('react-native')>('react-native');
  return { Image: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock('@/components/app-text', () => {
  const mockJest = require('@jest/globals').jest as typeof jest;
  return { AppText: mockJest.requireActual<typeof import('react-native')>('react-native').Text };
});

jest.mock('@/features/wardrobe/wardrobe-provider', () => ({ useWardrobe: jest.fn() }));

const mockPush = router.push as jest.MockedFunction<typeof router.push>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<
  typeof useSafeAreaInsets
>;
const mockUseWardrobe = useWardrobe as jest.MockedFunction<typeof useWardrobe>;
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

function clothing(
  id: string,
  category: ClothingCategory,
  overrides: Partial<ClothingItem> = {},
): ClothingItem {
  return {
    id,
    name: id,
    category,
    formality: 'casual',
    color: '#224466',
    imageUri: `file:///${id}.jpg`,
    isFavorite: false,
    createdAt: '2026-09-30T00:00:00.000Z',
    ...overrides,
  };
}

function completeWardrobe() {
  return [
    clothing('Top one', 'tops', { formality: 'formal', isFavorite: true }),
    clothing('Top two', 'tops'),
    clothing('Bottom one', 'bottoms'),
    clothing('Bottom two', 'bottoms'),
    clothing('Dress one', 'dresses'),
    clothing('Dress two', 'dresses'),
    clothing('Shoes one', 'shoes'),
    clothing('Shoes two', 'shoes'),
    clothing('Layer one', 'outerwear'),
    clothing('Accessory one', 'accessories'),
  ];
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function savedOutfit(input: SaveOutfitInput): SavedOutfit {
  return {
    ...input,
    id: 'saved-outfit',
    name: 'Saved look',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

type TestView = Awaited<ReturnType<typeof render>>;

function mainSaveButton(view: TestView) {
  return view.getByText(/^(Save outfit|✓ Saved)$/).parent!;
}

function modalSaveButton(view: TestView) {
  return view.getByText(/^Save \d+-piece outfit$/).parent!;
}

beforeEach(() => {
  for (const key of Object.keys(mockParams) as (keyof SearchParams)[]) {
    delete mockParams[key];
  }
  mockWardrobe.items = completeWardrobe();
  mockUseLocalSearchParams.mockReturnValue(mockParams);
  mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 24, left: 0 });
  mockSaveOutfit.mockReset();
  mockSaveOutfit.mockImplementation(async (input) => savedOutfit(input));
  mockUseWardrobe.mockReturnValue(
    {
      items: mockWardrobe.items,
      saveOutfit: mockSaveOutfit,
    } as unknown as ReturnType<typeof useWardrobe>,
  );
});

describe('TryOutfitsScreen', () => {
  test('cycles, locks, shuffles, opens pieces, and switches between outfit modes', async () => {
    mockParams.itemIds = [' Top one , , Bottom one '];
    mockParams.occasion = ['work', 'ignored'];
    mockParams.formality = ['formal'];
    mockParams.plannedFor = ['2026-10-02'];
    const view = await render(<TryOutfitsScreen />);

    expect(view.getByText('Try outfits')).toBeTruthy();
    expect(view.getByText('Top one')).toBeTruthy();
    expect(view.getByText('Bottom one')).toBeTruthy();
    expect(view.getAllByText('None')).toHaveLength(3);

    await fireEvent.press(view.getByRole('button', { name: 'Open Top one' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/clothes', params: { id: 'Top one' } });

    await fireEvent.press(view.getByRole('button', { name: 'Keep top during shuffle' }));
    expect(view.getByRole('button', { name: 'Unlock top during shuffle' })).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Unlock top during shuffle' }));
    await fireEvent.press(view.getByRole('button', { name: 'Keep shoes during shuffle' }));
    expect(view.getByRole('button', { name: 'Unlock shoes during shuffle' })).toBeTruthy();

    await fireEvent.press(view.getByRole('button', { name: 'Next top' }));
    expect(view.getByText('Top two')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Previous top' }));
    expect(view.getByText('Top one')).toBeTruthy();
    await fireEvent.press(view.getByText('Shuffle'));

    await fireEvent.press(view.getByText('Dress'));
    expect(view.getAllByText('None')).not.toHaveLength(0);
    await fireEvent.press(view.getByRole('button', { name: 'Next dress' }));
    expect(view.getByText('Dress one')).toBeTruthy();
    await fireEvent.press(view.getByText('Top + bottom'));
  });

  test('renders empty slots, disables unavailable actions, and opens add clothes', async () => {
    mockWardrobe.items = [];
    mockUseWardrobe.mockReturnValue(
      { items: [], saveOutfit: mockSaveOutfit } as unknown as ReturnType<typeof useWardrobe>,
    );
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, right: 0, bottom: 0, left: 0 });
    const view = await render(<TryOutfitsScreen />);

    expect(view.getAllByText('Add')).toHaveLength(5);
    expect(view.getByText('Shuffle').parent?.props.accessibilityState.disabled).toBe(true);
    expect(mainSaveButton(view).props.accessibilityState.disabled).toBe(true);

    await fireEvent.press(view.getAllByText('Add')[0]);
    expect(mockPush).toHaveBeenCalledWith('/add-clothes');

    await act(async () => mainSaveButton(view).props.onPress());
    await act(async () => modalSaveButton(view).props.onPress());
    expect(mockSaveOutfit).not.toHaveBeenCalled();
    await fireEvent.press(view.getByRole('button', { name: 'Close save outfit' }));
  });

  test('edits save details, handles close requests, saves once, and invalidates the saved mark', async () => {
    const pending = deferred<SavedOutfit>();
    mockSaveOutfit.mockReturnValueOnce(pending.promise);
    const view = await render(<TryOutfitsScreen />);

    await fireEvent.press(view.getByText('Save outfit'));
    expect(view.getByText('When will you wear it?')).toBeTruthy();
    await fireEvent.press(view.getByText(/Work \/ school/));
    await fireEvent.press(view.getByText('Formal'));
    const dateButtons = view.getAllByRole('button').filter(
      (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.includes(','),
    );
    expect(dateButtons).toHaveLength(7);
    await fireEvent.press(dateButtons[2]);

    const pendingSaveButton = modalSaveButton(view);
    await fireEvent.press(view.getByText(/Save \d+-piece outfit/));
    await waitFor(() => expect(mockSaveOutfit).toHaveBeenCalledTimes(1));
    await act(async () => pendingSaveButton.props.onPress());
    expect(mockSaveOutfit).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve(savedOutfit(mockSaveOutfit.mock.calls[0][0])));
    await waitFor(() => expect(view.getByText('✓ Saved')).toBeTruthy());

    await act(async () => mainSaveButton(view).props.onPress());
    await act(async () => modalSaveButton(view).props.onPress());
    expect(mockSaveOutfit).toHaveBeenCalledTimes(1);
    await fireEvent.press(view.getByRole('button', { name: 'Close save outfit' }));

    await fireEvent.press(view.getByRole('button', { name: 'Next top' }));
    expect(view.getByText('Save outfit')).toBeTruthy();
    await fireEvent.press(view.getByText('Save outfit'));
    const modal = view.getByTestId('save-outfit-modal');
    await act(async () => modal.props.onRequestClose());
    expect(view.queryByText('When will you wear it?')).toBeNull();
  });

  test.each([
    [new Error('Storage failed'), 'Storage failed'],
    ['bad response', 'Please try again.'],
  ])('reports save failures for %p', async (reason, message) => {
    mockSaveOutfit.mockRejectedValueOnce(reason);
    const view = await render(<TryOutfitsScreen />);
    await fireEvent.press(view.getByText('Save outfit'));
    await fireEvent.press(view.getByText(/Save \d+-piece outfit/));

    expect(alertSpy).toHaveBeenLastCalledWith('Couldn’t save this outfit', message);
    expect(view.getByText('When will you wear it?')).toBeTruthy();
  });

  test('imports a changed planner request and falls back from invalid values', async () => {
    mockParams.importToken = 'first';
    mockParams.itemIds = 'Top one,Bottom one';
    mockParams.occasion = 'invalid';
    mockParams.formality = 'invalid';
    mockParams.plannedFor = 'not-a-date';
    const view = await render(<TryOutfitsScreen />);

    mockParams.importToken = ['second'];
    mockParams.itemIds = ['Dress one'];
    mockParams.occasion = ['date'];
    mockParams.formality = ['black-tie'];
    mockParams.plannedFor = ['2026-10-04'];
    await view.rerender(<TryOutfitsScreen />);

    await waitFor(() => expect(view.getByText('Dress one')).toBeTruthy());
    await fireEvent.press(view.getByText('Save outfit'));
    expect(view.getByText(/♥\s+Date/)).toBeTruthy();
    expect(view.getByText('Black tie').parent?.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(view.getByRole('button', { name: 'Close save outfit' }));
    mockParams.importToken = 'third';
    mockParams.itemIds = 'Top one,Bottom one';
    mockParams.occasion = 'invalid-again';
    mockParams.formality = 'invalid-again';
    mockParams.plannedFor = 'invalid-again';
    await view.rerender(<TryOutfitsScreen />);
    await waitFor(() => expect(view.getByText('Top one')).toBeTruthy());
  });
});
