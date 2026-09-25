import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import {
  Layout,
  Palette,
  Radius,
} from '@/constants/design';
import {
  useTextSize,
  type TextSizeOption,
} from '@/features/wardrobe/settings/text-size-provider';

const TEXT_SIZE_OPTIONS: {
  value: TextSizeOption;
  title: string;
  description: string;
}[] = [
  {
    value: 'small',
    title: 'Small',
    description: 'More content fits on screen',
  },
  {
    value: 'default',
    title: 'Default',
    description: 'Recommended text size',
  },
  {
    value: 'large',
    title: 'Large',
    description: 'Larger and easier to read',
  },
  {
    value: 'extraLarge',
    title: 'Extra Large',
    description: 'Maximum readability',
  },
];

export default function SettingsScreen() {
  const {
    textSize,
    setTextSize,
  } = useTextSize();

  return (
    <View style={styles.screen}>
      <SafeAreaView
        edges={['top']}
        style={styles.safeArea}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <View>
              <AppText style={styles.eyebrow}>
                ONLINEWARDROBE
              </AppText>

              <AppText style={styles.title}>
                Settings
              </AppText>

              <AppText style={styles.subtitle}>
                Customize your app experience.
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>
                TEXT SIZE
              </AppText>

              <View style={styles.settingsCard}>
                {TEXT_SIZE_OPTIONS.map(
                  (option, index) => {
                    const selected =
                      textSize === option.value;

                    return (
                      <View key={option.value}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{
                            selected,
                          }}
                          onPress={() =>
                            setTextSize(option.value)
                          }
                          style={({ pressed }) => [
                            styles.optionRow,
                            pressed &&
                              styles.optionPressed,
                          ]}
                        >
                          <View style={styles.optionCopy}>
                            <AppText
                              style={[
                                styles.optionTitle,
                                selected &&
                                  styles.optionTitleSelected,
                              ]}
                            >
                              {option.title}
                            </AppText>

                            <AppText
                              style={
                                styles.optionDescription
                              }
                            >
                              {option.description}
                            </AppText>
                          </View>

                          <View
                            style={[
                              styles.radioOuter,
                              selected &&
                                styles.radioOuterSelected,
                            ]}
                          >
                            {selected && (
                              <View
                                style={
                                  styles.radioInner
                                }
                              />
                            )}
                          </View>
                        </Pressable>

                        {index <
                          TEXT_SIZE_OPTIONS.length -
                            1 && (
                          <View
                            style={styles.divider}
                          />
                        )}
                      </View>
                    );
                  },
                )}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>
                PREVIEW
              </AppText>

              <View style={styles.previewCard}>
                <View style={styles.previewIcon}>
                  <Ionicons
                    name="shirt-outline"
                    size={26}
                    color={Palette.brand}
                  />
                </View>

                <AppText style={styles.previewTitle}>
                  Your online wardrobe
                </AppText>

                <AppText style={styles.previewBody}>
                  Keep your clothes organized
                  and ready for your next look.
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Layout.tabClearance,
  },

  content: {
    width: '100%',
    maxWidth: Layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.gutter,
    paddingTop: 14,
    gap: 32,
  },

  eyebrow: {
    color: Palette.brand,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 3,
  },

  title: {
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },

  subtitle: {
    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },

  section: {
    gap: 12,
  },

  sectionLabel: {
    color: Palette.brand,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  settingsCard: {
    overflow: 'hidden',

    borderRadius: Radius.large,

    backgroundColor: Palette.surface,

    borderWidth: 1,
    borderColor: Palette.border,
  },

  optionRow: {
    minHeight: 74,

    paddingHorizontal: 18,
    paddingVertical: 14,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 16,
  },

  optionPressed: {
    backgroundColor: Palette.brandSoft,
  },

  optionCopy: {
    flex: 1,
    gap: 3,
  },

  optionTitle: {
    color: Palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },

  optionTitleSelected: {
    color: Palette.brand,
  },

  optionDescription: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
    marginLeft: 18,
  },

  radioOuter: {
    width: 24,
    height: 24,

    borderRadius: 12,

    borderWidth: 2,
    borderColor: Palette.border,

    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterSelected: {
    borderColor: Palette.brand,
  },

  radioInner: {
    width: 12,
    height: 12,

    borderRadius: 6,

    backgroundColor: Palette.brand,
  },

  previewCard: {
    padding: 22,

    borderRadius: Radius.large,

    backgroundColor: Palette.brandSoft,

    alignItems: 'center',

    gap: 9,
  },

  previewIcon: {
    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: Palette.surface,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 4,
  },

  previewTitle: {
    color: Palette.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },

  previewBody: {
    maxWidth: 300,

    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,

    textAlign: 'center',
  },
});