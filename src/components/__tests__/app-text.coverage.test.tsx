import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, renderHook } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import {
  AppText,
  AppTextInput,
  ScaledText,
  useScaledTextStyle,
} from '../app-text';
import { useTextSize } from '@/features/wardrobe/text-size-provider';

jest.mock('@/features/wardrobe/text-size-provider', () => ({
  useTextSize: jest.fn(),
}));

const mockUseTextSize = useTextSize as jest.MockedFunction<typeof useTextSize>;

beforeEach(() => {
  mockUseTextSize.mockReset();
  mockUseTextSize.mockReturnValue({ scale: 1 } as ReturnType<typeof useTextSize>);
});

describe('scaled application text', () => {
  test('keeps original styles at the normal scale and when disabled', async () => {
    const normal = await render(
      <AppText testID="normal" style={{ fontSize: 12 }}>Normal</AppText>,
    );
    expect(StyleSheet.flatten(normal.getByTestId('normal').props.style)).toEqual({ fontSize: 12 });
    await normal.unmount();

    mockUseTextSize.mockReturnValue({ scale: 2 } as ReturnType<typeof useTextSize>);
    const disabled = await render(
      <AppText testID="disabled" scaleText={false} style={{ fontSize: 12 }}>Disabled</AppText>,
    );
    expect(StyleSheet.flatten(disabled.getByTestId('disabled').props.style)).toEqual({ fontSize: 12 });
  });

  test('scales explicit metrics and the default font size', async () => {
    mockUseTextSize.mockReturnValue({ scale: 1.25 } as ReturnType<typeof useTextSize>);
    const view = await render(
      <>
        <AppText testID="metrics" style={{ fontSize: 13, lineHeight: 19 }}>Metrics</AppText>
        <AppText testID="default" defaultFontSize={15}>Default</AppText>
        <AppTextInput
          testID="input"
          defaultFontSize={10}
          style={{ fontSize: 11, lineHeight: 15 }}
          value="Input"
        />
      </>,
    );

    expect(StyleSheet.flatten(view.getByTestId('metrics').props.style)).toEqual(
      expect.objectContaining({ fontSize: 16.25, lineHeight: 23.75 }),
    );
    expect(StyleSheet.flatten(view.getByTestId('default').props.style)).toEqual(
      expect.objectContaining({ fontSize: 18.75 }),
    );
    expect(StyleSheet.flatten(view.getByTestId('input').props.style)).toEqual(
      expect.objectContaining({ fontSize: 13.75, lineHeight: 18.75 }),
    );
  });

  test('does not add a default size to nested text', async () => {
    mockUseTextSize.mockReturnValue({ scale: 2 } as ReturnType<typeof useTextSize>);
    const view = await render(
      <AppText testID="outer">
        Outer <AppText testID="inner">Inner</AppText>
      </AppText>,
    );

    expect(StyleSheet.flatten(view.getByTestId('outer').props.style)).toEqual({ fontSize: 28 });
    expect(view.getByTestId('inner').props.style).toBeUndefined();
  });

  test.each([0, Number.NaN, 'large'])('falls back safely for invalid scale %p', async (scale) => {
    mockUseTextSize.mockReturnValue({ scale } as unknown as ReturnType<typeof useTextSize>);
    const view = await render(<ScaledText testID="safe">Safe</ScaledText>);
    expect(view.getByTestId('safe').props.style).toBeUndefined();
  });

  test('ignores non-numeric text metrics and supports hook defaults', async () => {
    mockUseTextSize.mockReturnValue({ scale: 2 } as ReturnType<typeof useTextSize>);
    const style = { fontSize: 'large', lineHeight: Number.NaN } as never;
    const hook = await renderHook(() => useScaledTextStyle(style, { defaultFontSize: 8 }));

    expect(StyleSheet.flatten(hook.result.current)).toEqual(
      expect.objectContaining({ fontSize: 16 }),
    );
    await hook.unmount();

    const defaultHook = await renderHook(() => useScaledTextStyle(undefined));
    expect(StyleSheet.flatten(defaultHook.result.current)).toEqual({ fontSize: 28 });
    await defaultHook.unmount();

    const disabledHook = await renderHook(() => useScaledTextStyle(undefined, { enabled: false }));
    expect(disabledHook.result.current).toBeUndefined();
  });

  test('supports an unscaled text input with default options', async () => {
    mockUseTextSize.mockReturnValue({ scale: 2 } as ReturnType<typeof useTextSize>);
    const view = await render(<AppTextInput testID="plain-input" scaleText={false} />);
    expect(view.getByTestId('plain-input').props.style).toBeUndefined();
  });
});
