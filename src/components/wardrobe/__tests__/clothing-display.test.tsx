import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import { i18nInstance as i18n } from '@/i18n';

import { ClothingCard } from '../clothing-card';
import { EmptyCloset } from '../empty-closet';
import type { ClothingItem } from '../../../features/wardrobe/types';

jest.mock('@/components/app-text', () => {
  const reactNative = jest.requireActual<typeof import('react-native')>('react-native');
  return { AppText: reactNative.Text };
});

jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  return {
    Image: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

function clothingItem(
  category: ClothingItem['category'],
  overrides: Partial<ClothingItem> = {},
): ClothingItem {
  return {
    id: `item-${category}`,
    name: `${category} item`,
    category,
    formality: 'smart-casual',
    color: '#123456',
    imageUri: `file:///${category}.jpg`,
    isFavorite: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ClothingCard', () => {
  const categoryCases: [ClothingItem['category'], string][] = [
    ['tops', 'Tops'],
    ['bottoms', 'Bottoms'],
    ['dresses', 'Dresses'],
    ['outerwear', 'Outerwear'],
    ['shoes', 'Shoes'],
    ['accessories', 'Accessories'],
  ];

  test.each(categoryCases)('renders %s metadata and opens the item', async (category, label) => {
    const onPress = jest.fn();
    const onToggleFavorite = jest.fn();
    const item = clothingItem(category);
    const view = await render(
      <ClothingCard
        item={item}
        onPress={onPress}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    expect(view.getByText(`${label} · Smart casual`)).toBeTruthy();
    expect(view.getByLabelText(`Photo of ${item.name}`).props.source).toEqual({
      uri: item.imageUri,
    });
    expect(view.getByLabelText(`Color: ${item.color}`)).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: item.name }));
    await fireEvent.press(
      view.getByRole('button', { name: `Add ${item.name} to favorites` }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  test('renders and removes a favorite with an unknown formality fallback', async () => {
    const onToggleFavorite = jest.fn();
    const item = clothingItem('tops', {
      formality: 'unknown' as ClothingItem['formality'],
      isFavorite: true,
    });
    const view = await render(
      <ClothingCard
        item={item}
        onPress={jest.fn()}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    expect(view.getByText('Tops ·')).toBeTruthy();
    const favorite = view.getByRole('button', {
      name: `Remove ${item.name} from favorites`,
    });
    expect(favorite.props.accessibilityState.selected).toBe(true);
    expect(view.getByText('♥')).toBeTruthy();
    await fireEvent.press(favorite);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  test('translates metadata and accessibility copy', async () => {
    await i18n.changeLanguage('th');
    const item = clothingItem('tops');
    const view = await render(
      <ClothingCard
        item={item}
        onPress={jest.fn()}
        onToggleFavorite={jest.fn()}
      />,
    );

    expect(view.getByText('เสื้อท่อนบน · สมาร์ตแคชชวล')).toBeTruthy();
    expect(view.getByLabelText(`รูปภาพของ ${item.name}`)).toBeTruthy();
    expect(view.getByLabelText(`สี: ${item.color}`)).toBeTruthy();
    expect(
      view.getByRole('button', { name: `เพิ่ม ${item.name} ในรายการโปรด` }),
    ).toBeTruthy();
  });
});

describe('EmptyCloset', () => {
  test('renders defaults and its action', async () => {
    const onButtonPress = jest.fn();
    const view = await render(<EmptyCloset onButtonPress={onButtonPress} />);

    expect(view.getByText('Your closet is waiting')).toBeTruthy();
    expect(
      view.getByText(
        'Add a few favorite pieces and start building outfits that feel like you.',
      ),
    ).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Add clothing' }));
    expect(onButtonPress).toHaveBeenCalledTimes(1);
  });

  test('renders custom copy without an action', async () => {
    const view = await render(
      <EmptyCloset body="Custom body" buttonLabel="Custom action" title="Custom title" />,
    );

    expect(view.getByText('Custom title')).toBeTruthy();
    expect(view.getByText('Custom body')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Custom action' })).toBeNull();
  });

  test('renders translated defaults', async () => {
    await i18n.changeLanguage('th');
    const view = await render(<EmptyCloset onButtonPress={jest.fn()} />);

    expect(view.getByText('ตู้เสื้อผ้าของคุณกำลังรออยู่')).toBeTruthy();
    expect(view.getByText('เพิ่มเสื้อผ้าชิ้นโปรด แล้วเริ่มจัดชุดในแบบที่เป็นคุณ')).toBeTruthy();
    expect(view.getByRole('button', { name: 'เพิ่มเสื้อผ้า' })).toBeTruthy();
  });
});
