import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/app-text";
import { Layout, Palette, Radius } from "@/constants/design";
import {
  useTextSize,
  type TextSizeOption,
} from "@/features/wardrobe/text-size-provider";
import { changeLanguage, getCurrentLanguage } from "@/i18n";

const TEXT_SIZE_OPTIONS: TextSizeOption[] = [
  "small",
  "default",
  "large",
  "extraLarge",
];

export default function SettingsScreen() {
  const { textSize, setTextSize } = useTextSize();
  const { t } = useTranslation();
  const language = getCurrentLanguage();

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <View>
              <AppText style={styles.eyebrow}>{t("common.brand")}</AppText>

              <AppText style={styles.title}>{t("settings.title")}</AppText>

              <AppText style={styles.subtitle}>{t("settings.subtitle")}</AppText>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>
                {t("settings.textSize")}
              </AppText>

              <View style={styles.settingsCard}>
                {TEXT_SIZE_OPTIONS.map((option, index) => {
                  const selected = textSize === option;

                  return (
                    <View key={option}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{
                          selected,
                        }}
                        onPress={() => setTextSize(option)}
                        style={({ pressed }) => [
                          styles.optionRow,
                          pressed && styles.optionPressed,
                        ]}
                      >
                        <View style={styles.optionCopy}>
                          <AppText
                            style={[
                              styles.optionTitle,
                              selected && styles.optionTitleSelected,
                            ]}
                          >
                            {t(`settings.textSizes.${option}.title`)}
                          </AppText>

                          <AppText style={styles.optionDescription}>
                            {t(`settings.textSizes.${option}.description`)}
                          </AppText>
                        </View>

                        <View
                          style={[
                            styles.radioOuter,
                            selected && styles.radioOuterSelected,
                          ]}
                        >
                          {selected && <View style={styles.radioInner} />}
                        </View>
                      </Pressable>

                      {index < TEXT_SIZE_OPTIONS.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>
                {t("settings.language")}
              </AppText>

              <View style={styles.settingsCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: language === "en",
                  }}
                  onPress={() => void changeLanguage("en")}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <AppText
                      style={[
                        styles.optionTitle,
                        language === "en" && styles.optionTitleSelected,
                      ]}
                    >
                      {t("settings.languages.english.title")}
                    </AppText>

                    <AppText style={styles.optionDescription}>
                      {t("settings.languages.english.description")}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      language === "en" && styles.radioOuterSelected,
                    ]}
                  >
                    {language === "en" && <View style={styles.radioInner} />}
                  </View>
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: language === "th",
                  }}
                  onPress={() => void changeLanguage("th")}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <AppText
                      style={[
                        styles.optionTitle,
                        language === "th" && styles.optionTitleSelected,
                      ]}
                    >
                      {t("settings.languages.thai.title")}
                    </AppText>

                    <AppText style={styles.optionDescription}>
                      {t("settings.languages.thai.description")}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      language === "th" && styles.radioOuterSelected,
                    ]}
                  >
                    {language === "th" && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>
                {t("settings.preview")}
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
                  {t("settings.previewTitle")}
                </AppText>

                <AppText style={styles.previewBody}>
                  {t("settings.previewBody")}
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
    width: "100%",
    maxWidth: Layout.maxWidth,
    alignSelf: "center",
    paddingHorizontal: Layout.gutter,
    paddingTop: 14,
    gap: 32,
  },

  eyebrow: {
    color: Palette.brand,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 3,
  },

  title: {
    color: Palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
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
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  settingsCard: {
    overflow: "hidden",

    borderRadius: Radius.large,

    backgroundColor: Palette.surface,

    borderWidth: 1,
    borderColor: Palette.border,
  },

  optionRow: {
    minHeight: 74,

    paddingHorizontal: 18,
    paddingVertical: 14,

    flexDirection: "row",

    alignItems: "center",

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
    fontWeight: "700",
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

    alignItems: "center",
    justifyContent: "center",
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

    alignItems: "center",

    gap: 9,
  },

  previewIcon: {
    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: Palette.surface,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 4,
  },

  previewTitle: {
    color: Palette.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    textAlign: "center",
  },

  previewBody: {
    maxWidth: 300,

    color: Palette.muted,
    fontSize: 14,
    lineHeight: 21,

    textAlign: "center",
  },
});
