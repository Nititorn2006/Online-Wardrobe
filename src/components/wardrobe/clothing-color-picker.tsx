import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Palette, Radius } from '@/constants/design';
import {
  COMMON_COLOR_OPTIONS,
  EXTENDED_COLOR_SWATCHES,
  isDarkClothingColor,
  normalizeClothingColor,
} from '@/features/wardrobe/color-palette';

export function ClothingColorPicker({
  disabled = false,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const normalizedValue = normalizeClothingColor(value) ?? value.toUpperCase();
  const isCommonColor = COMMON_COLOR_OPTIONS.some(
    (option) => option.hex === normalizedValue,
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState(!isCommonColor);
  const customSwatches =
    !isCommonColor &&
    normalizeClothingColor(normalizedValue) &&
    !EXTENDED_COLOR_SWATCHES.includes(
      normalizedValue as (typeof EXTENDED_COLOR_SWATCHES)[number],
    )
      ? [normalizedValue, ...EXTENDED_COLOR_SWATCHES]
      : [...EXTENDED_COLOR_SWATCHES];

  return (
    <View style={styles.container}>
      <View style={styles.commonGrid}>
        {COMMON_COLOR_OPTIONS.map((option) => {
          const isSelected = normalizedValue === option.hex;

          return (
            <Pressable
              accessibilityLabel={`${option.name} color`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              key={option.name}
              onPress={() => onChange(option.hex)}
              style={({ pressed }) => [
                styles.commonChip,
                isSelected && styles.commonChipSelected,
                pressed && styles.pressed,
              ]}>
              <View
                style={[
                  styles.commonSwatch,
                  { backgroundColor: option.hex },
                  option.name === 'White' && styles.lightSwatch,
                ]}>
                {isSelected && (
                  <AppText
                    style={[
                      styles.check,
                      !isDarkClothingColor(option.hex) && styles.checkDark,
                    ]}>
                    ✓
                  </AppText>
                )}
              </View>
              <AppText numberOfLines={1} style={styles.commonLabel}>
                {option.name}
              </AppText>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityLabel="More colors"
          accessibilityRole="button"
          accessibilityState={{ expanded: isPaletteOpen, selected: !isCommonColor, disabled }}
          disabled={disabled}
          onPress={() => setIsPaletteOpen((value) => !value)}
          style={({ pressed }) => [
            styles.moreChip,
            !isCommonColor && styles.commonChipSelected,
            pressed && styles.pressed,
          ]}>
          <View
            style={[
              styles.moreSwatch,
              !isCommonColor && { backgroundColor: normalizedValue },
            ]}>
            {isCommonColor ? (
              <AppText style={styles.moreIcon}>+</AppText>
            ) : (
              <AppText
                style={[
                  styles.check,
                  !isDarkClothingColor(normalizedValue) && styles.checkDark,
                ]}>
                ✓
              </AppText>
            )}
          </View>
          <AppText style={styles.commonLabel}>More colors</AppText>
        </Pressable>
      </View>

      {isPaletteOpen && (
        <View style={styles.paletteCard}>
          <View style={styles.paletteHeading}>
            <View>
              <AppText style={styles.paletteTitle}>Pick a shade</AppText>
              <AppText style={styles.paletteHint}>Tap a color—no HEX code needed.</AppText>
            </View>
            <View style={[styles.currentPreview, { backgroundColor: normalizedValue }]} />
          </View>

          <View style={styles.swatchGrid}>
            {customSwatches.map((hex, index) => {
              const isSelected = normalizedValue === hex;

              return (
                <Pressable
                  accessibilityLabel={`Color shade ${index + 1}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled }}
                  disabled={disabled}
                  key={hex}
                  onPress={() => onChange(hex)}
                  style={({ pressed }) => [
                    styles.swatchButton,
                    isSelected && styles.swatchButtonSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.extendedSwatch, { backgroundColor: hex }]}>
                    {isSelected && (
                      <AppText
                        style={[
                          styles.check,
                          !isDarkClothingColor(hex) && styles.checkDark,
                        ]}>
                        ✓
                      </AppText>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  commonChip: {
    minWidth: 98,
    minHeight: 47,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderColor: '#D4CEC3',
    borderWidth: 1,
    backgroundColor: Palette.surface,
    flexGrow: 1,
    flexBasis: '28%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  commonChipSelected: {
    borderColor: Palette.brand,
    borderWidth: 2,
    backgroundColor: Palette.brandSoft,
    paddingHorizontal: 10,
  },
  commonSwatch: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightSwatch: { borderColor: '#D2D1CC', borderWidth: 1 },
  commonLabel: {
    flexShrink: 1,
    color: Palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  moreChip: {
    width: '100%',
    minHeight: 50,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderColor: '#D4CEC3',
    borderWidth: 1,
    backgroundColor: Palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  moreSwatch: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AAA59B',
    backgroundColor: '#F3F0E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: { color: Palette.muted, fontSize: 18, lineHeight: 19, fontWeight: '500' },
  check: { color: Palette.white, fontSize: 13, lineHeight: 16, fontWeight: '900' },
  checkDark: { color: Palette.ink },
  paletteCard: {
    padding: 14,
    gap: 13,
    borderRadius: Radius.medium,
    backgroundColor: '#EEEAE2',
    borderWidth: 1,
    borderColor: '#D8D2C7',
  },
  paletteHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paletteTitle: { color: Palette.ink, fontSize: 14, fontWeight: '700' },
  paletteHint: { color: Palette.muted, fontSize: 11, lineHeight: 16 },
  currentPreview: {
    width: 36,
    height: 36,
    marginLeft: 'auto',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  swatchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchButtonSelected: { backgroundColor: Palette.surface },
  extendedSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
