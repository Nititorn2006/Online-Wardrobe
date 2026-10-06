import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en";
import th from "./th";

export const LANGUAGE_KEY = "app-language";
export type SupportedLanguage = "en" | "th";

export function getDeviceLanguage(): SupportedLanguage {
  return Localization.getLocales()[0]?.languageCode === "th" ? "th" : "en";
}

export const i18nInstance = createInstance();

const initialization = i18nInstance.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    th: {
      translation: th,
    },
  },

  lng: getDeviceLanguage(),

  fallbackLng: "en",
  supportedLngs: ["en", "th"],
  returnNull: false,

  interpolation: {
    escapeValue: false,
  },
});

export async function loadSavedLanguage(): Promise<void> {
  try {
    await initialization;

    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (savedLanguage === "en" || savedLanguage === "th") {
      await i18nInstance.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error("Failed to load language:", error);
  }
}

export async function changeLanguage(
  language: SupportedLanguage,
): Promise<void> {
  try {
    await initialization;

    await i18nInstance.changeLanguage(language);

    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error("Failed to change language:", error);
  }
}

export function getCurrentLanguage(): SupportedLanguage {
  return i18nInstance.resolvedLanguage === "th" ? "th" : "en";
}

export function getLocalizedErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (getCurrentLanguage() !== "en") {
    return fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export default i18nInstance;
