import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Pressable, Text } from 'react-native';

import {
  TextSizeProvider,
  type TextSizeOption,
  useTextSize,
} from '../text-size-provider';

jest.mock('@react-native-async-storage/async-storage', () => {
  // The factory runs before ESM imports, so obtain Jest lazily.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockJest = require('@jest/globals').jest as typeof jest;
  const storage = {
    getItem: mockJest.fn(),
    setItem: mockJest.fn(),
  };

  return { __esModule: true, default: storage, ...storage };
});

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function TextSizeProbe() {
  const { scale, setTextSize, textSize } = useTextSize();

  return (
    <>
      <Text testID="current-size">{`${textSize}:${scale}`}</Text>
      {(['small', 'default', 'large', 'extraLarge'] as TextSizeOption[]).map(
        (option) => (
          <Pressable
            key={option}
            onPress={() => setTextSize(option)}
            testID={`choose-${option}`}
          />
        ),
      )}
    </>
  );
}

describe('TextSizeProvider', () => {
  const textSizeCases: [TextSizeOption, number][] = [
    ['small', 0.9],
    ['default', 1],
    ['large', 1.15],
    ['extraLarge', 1.3],
  ];

  beforeEach(() => {
    mockedStorage.getItem.mockReset();
    mockedStorage.setItem.mockReset();
    mockedStorage.setItem.mockResolvedValue(undefined);
  });

  test.each(textSizeCases)('loads the saved %s setting', async (savedValue, expectedScale) => {
    mockedStorage.getItem.mockResolvedValue(savedValue);
    const view = await render(
      <TextSizeProvider>
        <TextSizeProbe />
      </TextSizeProvider>,
    );

    await waitFor(() => {
      expect(view.getByTestId('current-size').props.children).toBe(
        `${savedValue}:${expectedScale}`,
      );
    });
    expect(mockedStorage.getItem).toHaveBeenCalledWith(
      '@onlinewardrobe/text-size',
    );
  });

  test('keeps the default for an unsupported saved setting', async () => {
    mockedStorage.getItem.mockResolvedValue('enormous');
    const view = await render(
      <TextSizeProvider>
        <TextSizeProbe />
      </TextSizeProvider>,
    );

    await waitFor(() => expect(mockedStorage.getItem).toHaveBeenCalled());
    expect(view.getByTestId('current-size').props.children).toBe('default:1');
  });

  test('keeps the default when loading the setting fails', async () => {
    mockedStorage.getItem.mockRejectedValue(new Error('unavailable'));
    const view = await render(
      <TextSizeProvider>
        <TextSizeProbe />
      </TextSizeProvider>,
    );

    await waitFor(() => expect(mockedStorage.getItem).toHaveBeenCalled());
    expect(view.getByTestId('current-size').props.children).toBe('default:1');
  });

  test.each(textSizeCases)('updates and persists the %s setting', async (option, expectedScale) => {
    mockedStorage.getItem.mockResolvedValue(null);
    const view = await render(
      <TextSizeProvider>
        <TextSizeProbe />
      </TextSizeProvider>,
    );

    await fireEvent.press(view.getByTestId(`choose-${option}`));

    expect(view.getByTestId('current-size').props.children).toBe(
      `${option}:${expectedScale}`,
    );
    expect(mockedStorage.setItem).toHaveBeenLastCalledWith(
      '@onlinewardrobe/text-size',
      option,
    );
  });

  test('requires consumers to be inside the provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<TextSizeProbe />)).rejects.toThrow(
      'useTextSize must be used inside TextSizeProvider',
    );
    consoleError.mockRestore();
  });
});
