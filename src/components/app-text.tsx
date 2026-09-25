import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ComponentRef,
} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { useTextSize } from '@/features/wardrobe/settings/text-size-provider';

const DEFAULT_FONT_SIZE = 14;

const InsideAppTextContext = createContext(false);

function isFiniteNumber(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}

function scaleMetric(value: number, scale: number) {
  return Math.round(value * scale * 100) / 100;
}

function buildScaledMetrics(
  style: StyleProp<TextStyle>,
  scale: number,
  isNested: boolean,
  defaultFontSize: number,
): TextStyle | undefined {
  if (scale === 1) {
    return undefined;
  }

  const flattened = StyleSheet.flatten(style);

  const fontSize = isFiniteNumber(flattened?.fontSize)
    ? flattened.fontSize
    : undefined;

  const lineHeight = isFiniteNumber(
    flattened?.lineHeight,
  )
    ? flattened.lineHeight
    : undefined;

  const scaledMetrics: TextStyle = {};

  if (fontSize !== undefined) {
    scaledMetrics.fontSize = scaleMetric(
      fontSize,
      scale,
    );
  } else if (!isNested) {
    scaledMetrics.fontSize = scaleMetric(
      defaultFontSize,
      scale,
    );
  }

  if (lineHeight !== undefined) {
    scaledMetrics.lineHeight = scaleMetric(
      lineHeight,
      scale,
    );
  }

  return Object.keys(scaledMetrics).length > 0
    ? scaledMetrics
    : undefined;
}

function useResolvedScaledTextStyle(
  style: StyleProp<TextStyle>,
  {
    defaultFontSize,
    enabled,
    isNested,
  }: {
    defaultFontSize: number;
    enabled: boolean;
    isNested: boolean;
  },
): StyleProp<TextStyle> {
  const { scale } = useTextSize();

  const safeScale =
    isFiniteNumber(scale) && scale > 0
      ? scale
      : 1;

  return useMemo(() => {
    if (!enabled || safeScale === 1) {
      return style;
    }

    const scaledMetrics = buildScaledMetrics(
      style,
      safeScale,
      isNested,
      defaultFontSize,
    );

    return scaledMetrics
      ? [style, scaledMetrics]
      : style;
  }, [
    defaultFontSize,
    enabled,
    isNested,
    safeScale,
    style,
  ]);
}

export type UseScaledTextStyleOptions = {
  defaultFontSize?: number;
  enabled?: boolean;
};

export function useScaledTextStyle(
  style: StyleProp<TextStyle>,
  {
    defaultFontSize = DEFAULT_FONT_SIZE,
    enabled = true,
  }: UseScaledTextStyleOptions = {},
): StyleProp<TextStyle> {
  return useResolvedScaledTextStyle(style, {
    defaultFontSize,
    enabled,
    isNested: false,
  });
}

export type AppTextProps = TextProps & {
  defaultFontSize?: number;
  scaleText?: boolean;
};

type NativeTextRef = ComponentRef<typeof Text>;

export const AppText = forwardRef<
  NativeTextRef,
  AppTextProps
>(function AppText(
  {
    children,
    defaultFontSize = DEFAULT_FONT_SIZE,
    scaleText = true,
    style,
    ...textProps
  },
  ref,
) {
  const isNested = useContext(
    InsideAppTextContext,
  );

  const resolvedStyle =
    useResolvedScaledTextStyle(style, {
      defaultFontSize,
      enabled: scaleText,
      isNested,
    });

  return (
    <InsideAppTextContext.Provider value>
      <Text
        ref={ref}
        {...textProps}
        style={resolvedStyle}
      >
        {children}
      </Text>
    </InsideAppTextContext.Provider>
  );
});

AppText.displayName = 'AppText';

export type AppTextInputProps = TextInputProps & {
  defaultFontSize?: number;
  scaleText?: boolean;
};

type NativeTextInputRef = ComponentRef<
  typeof TextInput
>;

export const AppTextInput = forwardRef<
  NativeTextInputRef,
  AppTextInputProps
>(function AppTextInput(
  {
    defaultFontSize = DEFAULT_FONT_SIZE,
    scaleText = true,
    style,
    ...textInputProps
  },
  ref,
) {
  const resolvedStyle = useScaledTextStyle(
    style,
    {
      defaultFontSize,
      enabled: scaleText,
    },
  );

  return (
    <TextInput
      ref={ref}
      {...textInputProps}
      style={resolvedStyle}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';

export const ScaledText = AppText;