import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';

import { ClothingColorPicker } from '../clothing-color-picker';
import {
  ADVANCED_COLOR_GRID,
  COMMON_COLOR_OPTIONS,
  SPECTRUM_COLOR_GRID,
} from '../../../features/wardrobe/color-palette';

jest.mock('@/components/app-text', () => {
  const reactNative = jest.requireActual<typeof import('react-native')>('react-native');
  return { AppText: reactNative.Text };
});

function PickerHarness({
  disabled,
  initialValue,
  onChange,
}: {
  disabled?: boolean;
  initialValue: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <ClothingColorPicker
      {...(disabled === undefined ? {} : { disabled })}
      onChange={(nextValue) => {
        onChange(nextValue);
        setValue(nextValue);
      }}
      value={value}
    />
  );
}

describe('ClothingColorPicker', () => {
  test('selects named colors and respects the disabled state', async () => {
    const onChange = jest.fn<(value: string) => void>();
    const view = await render(
      <PickerHarness initialValue="#292A2A" onChange={onChange} />,
    );

    expect(view.getByRole('button', { name: 'Black color' }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent(view.getByRole('button', { name: 'White color' }), 'pressIn');
    await fireEvent(view.getByRole('button', { name: 'White color' }), 'pressOut');
    await fireEvent.press(view.getByRole('button', { name: 'White color' }));
    expect(onChange).toHaveBeenLastCalledWith('#FAFAF7');
    expect(view.getByRole('button', { name: 'White color' }).props.accessibilityState.selected).toBe(
      true,
    );

    await view.rerender(
      <PickerHarness disabled initialValue="#292A2A" onChange={onChange} />,
    );
    const otherButton = view.getByRole('button', { name: 'Other colors' });
    expect(otherButton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(otherButton);
    expect(view.queryByText('Colors')).toBeNull();
  });

  test('opens the advanced picker and selects grid and spectrum colors', async () => {
    const onChange = jest.fn<(value: string) => void>();
    const view = await render(
      <PickerHarness initialValue="#123456" onChange={onChange} />,
    );

    expect(view.getByRole('button', { name: 'Other colors' }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent(view.getByRole('button', { name: 'Other colors' }), 'pressIn');
    await fireEvent(view.getByRole('button', { name: 'Other colors' }), 'pressOut');
    await fireEvent.press(view.getByRole('button', { name: 'Other colors' }));
    expect(view.getByText('Colors')).toBeTruthy();

    const gridColor = ADVANCED_COLOR_GRID[0][0];
    const gridButton = view.getByRole('button', {
      name: 'Grid color, row 1, column 1',
    });
    await fireEvent(gridButton, 'pressIn');
    await fireEvent(gridButton, 'pressOut');
    await fireEvent.press(gridButton);
    expect(onChange).toHaveBeenLastCalledWith(gridColor);
    await fireEvent.press(
      view.getByRole('button', { name: 'Grid color, row 1, column 1' }),
    );
    expect(onChange).toHaveBeenCalledTimes(1);

    const spectrumTab = view.getByRole('tab', { name: 'Spectrum' });
    await fireEvent(spectrumTab, 'pressIn');
    await fireEvent(spectrumTab, 'pressOut');
    await fireEvent.press(spectrumTab);
    const spectrumButton = view.getByRole('button', {
      name: 'Spectrum color, row 1, column 2',
    });
    await fireEvent.press(spectrumButton);
    expect(onChange).toHaveBeenLastCalledWith(SPECTRUM_COLOR_GRID[0][1]);

    const quickColor = view.getByRole('button', { name: 'Black quick color' });
    await fireEvent(quickColor, 'pressIn');
    await fireEvent(quickColor, 'pressOut');
    await fireEvent.press(quickColor);
    expect(onChange).toHaveBeenLastCalledWith(COMMON_COLOR_OPTIONS[0].hex);
  });

  test('changes hue, saturation, and brightness with slider controls', async () => {
    const onChange = jest.fn<(value: string) => void>();
    const view = await render(
      <PickerHarness initialValue="#FF0000" onChange={onChange} />,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Other colors' }));
    const slidersTab = view.getByRole('tab', { name: 'Sliders' });
    await fireEvent.press(slidersTab);

    const hue = view.getByRole('button', { name: 'Set Hue to 120°' });
    await fireEvent(hue, 'pressIn');
    await fireEvent(hue, 'pressOut');
    await fireEvent.press(hue);
    expect(onChange).toHaveBeenLastCalledWith('#00FF00');

    await fireEvent.press(
      view.getByRole('button', { name: 'Set Saturation to 0%' }),
    );
    expect(onChange).toHaveBeenLastCalledWith('#FFFFFF');

    await fireEvent.press(
      view.getByRole('button', { name: 'Set Brightness to 0%' }),
    );
    expect(onChange).toHaveBeenLastCalledWith('#000000');

    const done = view.getByRole('button', { name: 'Done' });
    await fireEvent(done, 'pressIn');
    await fireEvent(done, 'pressOut');
    await fireEvent.press(done);
    expect(view.queryByText('Colors')).toBeNull();
  });

  test('falls back safely for invalid input and closes from the header', async () => {
    const onChange = jest.fn<(value: string) => void>();
    const view = await render(
      <PickerHarness initialValue="bad" onChange={onChange} />,
    );

    await fireEvent.press(view.getByRole('button', { name: 'Other colors' }));
    expect(view.getByText('Colors')).toBeTruthy();
    const close = view.getByRole('button', { name: 'Close color picker' });
    await fireEvent(close, 'pressIn');
    await fireEvent(close, 'pressOut');
    await fireEvent.press(close);
    expect(view.queryByText('Colors')).toBeNull();
  });
});
