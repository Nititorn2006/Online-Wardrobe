import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { AdvancedColorPicker } from '@/components/wardrobe/advanced-color-picker';
import { Palette } from '@/constants/design';
import {
  COMMON_COLOR_OPTIONS,
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const normalizedValue = normalizeClothingColor(value) ?? value.toUpperCase();
  const isCommonColor = COMMON_COLOR_OPTIONS.some(
    (option) => option.hex === normalizedValue,
  );

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
                PRESSED_STYLES[Number(pressed)],
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
          accessibilityLabel="Other colors"
          accessibilityRole="button"
          accessibilityState={{
            expanded: isPickerOpen,
            selected: !isCommonColor,
            disabled,
          }}
          disabled={disabled}
          onPress={() => setIsPickerOpen(true)}
          style={({ pressed }) => [
            styles.otherChip,
            !isCommonColor && styles.commonChipSelected,
            PRESSED_STYLES[Number(pressed)],
          ]}>
          <View
            style={[
              styles.otherSwatch,
              !isCommonColor && { backgroundColor: normalizedValue },
            ]}>
            {isCommonColor ? (
              <AppText style={styles.otherIcon}>＋</AppText>
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
          <View style={styles.otherCopy}>
            <AppText style={styles.commonLabel}>Other</AppText>
            <AppText style={styles.otherHint}>Grid, spectrum, and sliders</AppText>
          </View>
          <AppText style={styles.otherArrow}>›</AppText>
        </Pressable>
      </View>

      <AdvancedColorPicker
        onChange={onChange}
        onClose={() => setIsPickerOpen(false)}
        value={normalizedValue}
        visible={isPickerOpen}
      />
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
  otherChip: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 11,
    borderRadius: 15,
    borderColor: '#D4CEC3',
    borderWidth: 1,
    backgroundColor: Palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  otherSwatch: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#AAA59B',
    backgroundColor: '#F3F0E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherIcon: { color: Palette.muted, fontSize: 18, lineHeight: 19, fontWeight: '500' },
  otherCopy: { flex: 1, minWidth: 0 },
  otherHint: { color: Palette.muted, fontSize: 10, lineHeight: 14 },
  otherArrow: { color: Palette.brand, fontSize: 24, lineHeight: 25 },
  check: { color: Palette.white, fontSize: 13, lineHeight: 16, fontWeight: '900' },
  checkDark: { color: Palette.ink },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});

const PRESSED_STYLES = [undefined, styles.pressed] as const;
