import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Palette, Radius } from '@/constants/design';
import {
  ADVANCED_COLOR_GRID,
  clothingColorToHsv,
  COMMON_COLOR_OPTIONS,
  DEFAULT_CLOTHING_COLOR,
  hsvToClothingColor,
  isDarkClothingColor,
  normalizeClothingColor,
  SPECTRUM_COLOR_GRID,
  updateHsvChannel,
  type HsvChannel,
} from '@/features/wardrobe/color-palette';

type PickerTab = 'grid' | 'spectrum' | 'sliders';

const PICKER_TABS: { value: PickerTab; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'spectrum', label: 'Spectrum' },
  { value: 'sliders', label: 'Sliders' },
];

const SLIDER_OPTIONS: {
  channel: HsvChannel;
  label: string;
  suffix: string;
  values: number[];
}[] = [
  {
    channel: 'hue',
    label: 'Hue',
    suffix: '°',
    values: Array.from({ length: 13 }, (_, index) => Math.min(index * 30, 359)),
  },
  {
    channel: 'saturation',
    label: 'Saturation',
    suffix: '%',
    values: Array.from({ length: 11 }, (_, index) => index * 10),
  },
  {
    channel: 'value',
    label: 'Brightness',
    suffix: '%',
    values: Array.from({ length: 11 }, (_, index) => index * 10),
  },
];

export function AdvancedColorPicker({
  onChange,
  onClose,
  value,
  visible,
}: {
  onChange: (value: string) => void;
  onClose: () => void;
  value: string;
  visible: boolean;
}) {
  const [activeTab, setActiveTab] = useState<PickerTab>('grid');
  const normalizedValue = normalizeClothingColor(value) ?? DEFAULT_CLOTHING_COLOR;
  const hsv = clothingColorToHsv(normalizedValue)!;

  const selectColor = (nextColor: string) => {
    if (nextColor !== normalizedValue) {
      onChange(nextColor);
    }
  };

  const renderColorGrid = (
    grid: readonly (readonly string[])[],
    label: string,
  ) => (
    <View accessibilityLabel={label} style={styles.colorGrid}>
      {grid.map((row, rowIndex) => (
        <View key={`${label}-row-${rowIndex}`} style={styles.colorRow}>
          {row.map((color, columnIndex) => {
            const isSelected = color === normalizedValue;

            return (
              <Pressable
                accessibilityLabel={`${label} color, row ${rowIndex + 1}, column ${columnIndex + 1}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={`${label}-${rowIndex}-${columnIndex}`}
                onPress={() => selectColor(color)}
                style={({ pressed }) => [
                  styles.gridCell,
                  { backgroundColor: color },
                  isSelected && styles.gridCellSelected,
                  PRESSED_STYLES[Number(pressed)],
                ]}>
                {isSelected && (
                  <AppText
                    style={[
                      styles.gridCheck,
                      !isDarkClothingColor(color) && styles.gridCheckDark,
                    ]}>
                    ✓
                  </AppText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <SafeAreaView
          accessibilityViewIsModal
          edges={['top', 'bottom']}
          style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerPreviewWrap}>
              <View style={[styles.headerPreview, { backgroundColor: normalizedValue }]} />
            </View>
            <AppText style={styles.title}>Colors</AppText>
            <Pressable
              accessibilityLabel="Close color picker"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, PRESSED_STYLES[Number(pressed)]]}>
              <AppText style={styles.closeButtonText}>×</AppText>
            </Pressable>
          </View>

          <View accessibilityRole="tablist" style={styles.tabBar}>
            {PICKER_TABS.map((tab) => {
              const isSelected = activeTab === tab.value;

              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  key={tab.value}
                  onPress={() => setActiveTab(tab.value)}
                  style={({ pressed }) => [
                    styles.tab,
                    isSelected && styles.tabSelected,
                    PRESSED_STYLES[Number(pressed)],
                  ]}>
                  <AppText
                    style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            {activeTab === 'grid' && renderColorGrid(ADVANCED_COLOR_GRID, 'Grid')}
            {activeTab === 'spectrum' && (
              <View style={styles.spectrumPanel}>
                {renderColorGrid(SPECTRUM_COLOR_GRID, 'Spectrum')}
                <View style={styles.spectrumNoteRow}>
                  <View style={[styles.smallPreview, { backgroundColor: normalizedValue }]} />
                  <AppText style={styles.spectrumNote}>
                    Tap anywhere in the spectrum to choose a shade.
                  </AppText>
                </View>
              </View>
            )}
            {activeTab === 'sliders' && (
              <View style={styles.sliderPanel}>
                <View style={[styles.largePreview, { backgroundColor: normalizedValue }]} />

                {SLIDER_OPTIONS.map((option) => {
                  const currentValue = hsv[option.channel];

                  return (
                    <View key={option.channel} style={styles.sliderGroup}>
                      <View style={styles.sliderHeading}>
                        <AppText style={styles.sliderLabel}>{option.label}</AppText>
                        <AppText style={styles.sliderValue}>
                          {currentValue}{option.suffix}
                        </AppText>
                      </View>
                      <View style={styles.sliderTrack}>
                        {option.values.map((channelValue) => {
                          const segmentColor =
                            option.channel === 'hue'
                              ? hsvToClothingColor({
                                  hue: channelValue,
                                  saturation: 100,
                                  value: 100,
                                })
                              : option.channel === 'saturation'
                                ? hsvToClothingColor({
                                    ...hsv,
                                    saturation: channelValue,
                                    value: Math.max(hsv.value, 35),
                                  })
                                : hsvToClothingColor({
                                    ...hsv,
                                    value: channelValue,
                                  });

                          return (
                            <Pressable
                              accessibilityLabel={`Set ${option.label} to ${channelValue}${option.suffix}`}
                              accessibilityRole="button"
                              key={channelValue}
                              onPress={() =>
                                selectColor(
                                  updateHsvChannel(
                                    normalizedValue,
                                    option.channel,
                                    channelValue,
                                  ),
                                )
                              }
                              style={({ pressed }) => [
                                styles.sliderSegment,
                                { backgroundColor: segmentColor },
                                PRESSED_STYLES[Number(pressed)],
                              ]}
                            />
                          );
                        })}
                        <View
                          pointerEvents="none"
                          style={[
                            styles.sliderThumb,
                            {
                              left: `${
                                option.channel === 'hue'
                                  ? (currentValue / 359) * 100
                                  : currentValue
                              }%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.savedColorsSection}>
              <View style={styles.divider} />
              <AppText style={styles.savedColorsLabel}>Quick colors</AppText>
              <View style={styles.savedColorsRow}>
                {COMMON_COLOR_OPTIONS.slice(0, 10).map((option) => {
                  const isSelected = option.hex === normalizedValue;

                  return (
                    <Pressable
                      accessibilityLabel={`${option.name} quick color`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={option.name}
                      onPress={() => selectColor(option.hex)}
                      style={({ pressed }) => [
                        styles.savedColorButton,
                        isSelected && styles.savedColorButtonSelected,
                        PRESSED_STYLES[Number(pressed)],
                      ]}>
                      <View
                        style={[
                          styles.savedColor,
                          { backgroundColor: option.hex },
                          option.name === 'White' && styles.lightColorBorder,
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.doneButton, PRESSED_STYLES[Number(pressed)]]}>
            <AppText style={styles.doneButtonText}>Done</AppText>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14,17,16,0.42)',
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '94%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Palette.surface,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerPreviewWrap: { width: 38 },
  headerPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Palette.surface,
    boxShadow: '0 0 0 1px rgba(32,40,38,0.16)',
  },
  title: { color: Palette.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECECEB',
  },
  closeButtonText: { color: Palette.muted, fontSize: 24, lineHeight: 25, fontWeight: '500' },
  tabBar: {
    height: 38,
    marginTop: 10,
    padding: 3,
    borderRadius: 9,
    flexDirection: 'row',
    backgroundColor: '#ECECEA',
  },
  tab: {
    flex: 1,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: Palette.surface,
    boxShadow: '0 1px 3px rgba(32,40,38,0.16)',
  },
  tabText: { color: Palette.ink, fontSize: 12, fontWeight: '600' },
  tabTextSelected: { fontWeight: '800' },
  content: { gap: 18, paddingTop: 16, paddingBottom: 14 },
  colorGrid: {
    width: '100%',
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#F2F2F0',
  },
  colorRow: { flexDirection: 'row' },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellSelected: {
    borderWidth: 3,
    borderColor: Palette.white,
    boxShadow: '0 0 0 2px #4338B8',
    zIndex: 1,
  },
  gridCheck: { color: Palette.white, fontSize: 10, lineHeight: 12, fontWeight: '900' },
  gridCheckDark: { color: Palette.ink },
  spectrumPanel: { gap: 13 },
  spectrumNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  smallPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Palette.surface,
    boxShadow: '0 0 0 1px rgba(32,40,38,0.16)',
  },
  spectrumNote: { flex: 1, color: Palette.muted, fontSize: 11, lineHeight: 16 },
  sliderPanel: { gap: 19 },
  largePreview: {
    width: '100%',
    height: 82,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sliderGroup: { gap: 8 },
  sliderHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabel: { color: Palette.ink, fontSize: 12, fontWeight: '700' },
  sliderValue: { color: Palette.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  sliderTrack: {
    height: 38,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  sliderSegment: { flex: 1, height: '100%' },
  sliderThumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: 5,
    marginLeft: -3,
    borderRadius: 3,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.ink,
  },
  savedColorsSection: { gap: 11 },
  divider: { height: 1, backgroundColor: Palette.border },
  savedColorsLabel: { color: Palette.muted, fontSize: 10, fontWeight: '700' },
  savedColorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  savedColorButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedColorButtonSelected: { backgroundColor: Palette.brandSoft },
  savedColor: { width: 28, height: 28, borderRadius: 14 },
  lightColorBorder: { borderWidth: 1, borderColor: Palette.border },
  doneButton: {
    minHeight: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.brand,
  },
  doneButtonText: { color: Palette.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});

const PRESSED_STYLES = [undefined, styles.pressed] as const;
