import AsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import * as Localization from "expo-localization";

import en from "../en";
import {
  changeLanguage,
  getCurrentLanguage,
  getDeviceLanguage,
  getLocalizedErrorMessage,
  i18nInstance as i18n,
  LANGUAGE_KEY,
  loadSavedLanguage,
} from "../index";
import th from "../th";

const getLocales = Localization.getLocales as jest.MockedFunction<
  typeof Localization.getLocales
>;
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function leafKeys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? leafKeys(child, path)
      : [path];
  });
}

function resourceKeys(value: object): string[] {
  return [
    ...new Set(leafKeys(value).map((key) => key.replace(/_(one|other)$/, ""))),
  ].sort();
}

describe("i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  test("maps Thai device locales to Thai and every other locale to English", () => {
    getLocales.mockReturnValueOnce([
      { languageCode: "th" } as ReturnType<typeof Localization.getLocales>[0],
    ]);
    expect(getDeviceLanguage()).toBe("th");

    getLocales.mockReturnValueOnce([
      { languageCode: "fr" } as ReturnType<typeof Localization.getLocales>[0],
    ]);
    expect(getDeviceLanguage()).toBe("en");

    getLocales.mockReturnValueOnce(
      [] as unknown as ReturnType<typeof Localization.getLocales>,
    );
    expect(getDeviceLanguage()).toBe("en");
  });

  test.each(["en", "th"] as const)(
    "loads the saved %s language",
    async (language) => {
      storage.getItem.mockResolvedValueOnce(language);

      await loadSavedLanguage();

      expect(storage.getItem).toHaveBeenCalledWith(LANGUAGE_KEY);
      expect(getCurrentLanguage()).toBe(language);
    },
  );

  test.each([null, "unsupported"])(
    "ignores a non-supported saved language: %s",
    async (savedLanguage) => {
      storage.getItem.mockResolvedValueOnce(savedLanguage);

      await loadSavedLanguage();

      expect(getCurrentLanguage()).toBe("en");
    },
  );

  test("reports a saved-language read failure without rejecting", async () => {
    const error = new Error("read failed");
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    storage.getItem.mockRejectedValueOnce(error);

    await expect(loadSavedLanguage()).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith("Failed to load language:", error);
    consoleError.mockRestore();
  });

  test("changes language immediately and persists the choice", async () => {
    await changeLanguage("th");

    expect(getCurrentLanguage()).toBe("th");
    expect(storage.setItem).toHaveBeenCalledWith(LANGUAGE_KEY, "th");
  });

  test("keeps the live language and reports a persistence failure", async () => {
    const error = new Error("write failed");
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    storage.setItem.mockRejectedValueOnce(error);

    await expect(changeLanguage("th")).resolves.toBeUndefined();

    expect(getCurrentLanguage()).toBe("th");
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to change language:",
      error,
    );
    consoleError.mockRestore();
  });

  test("keeps English and Thai resources in parity", () => {
    expect(resourceKeys(th)).toEqual(resourceKeys(en));
  });

  test("translates interpolation, plurals, and fallback values", async () => {
    expect(i18n.t("home.savedOutfitsCount", { count: 1 })).toBe(
      "1 look ready to wear",
    );
    expect(i18n.t("home.savedOutfitsCount", { count: 2 })).toBe(
      "2 looks ready to wear",
    );
    expect(i18n.t("closet.empty.searchBody", { query: "coat" })).toContain(
      "“coat”",
    );

    await i18n.changeLanguage("th");

    expect(i18n.t("closet.itemCount", { count: 3 })).toBe(
      "3 ชิ้น พร้อมสำหรับการจัดชุด",
    );
    expect(i18n.t("missing.translation", { defaultValue: "Fallback" })).toBe(
      "Fallback",
    );
  });

  test("keeps technical error details in English and uses translated fallbacks in Thai", async () => {
    expect(getLocalizedErrorMessage(new Error("Detailed failure"), "Fallback")).toBe(
      "Detailed failure",
    );
    expect(getLocalizedErrorMessage(new Error(""), "Fallback")).toBe("Fallback");
    expect(getLocalizedErrorMessage("failure", "Fallback")).toBe("Fallback");

    await i18n.changeLanguage("th");

    expect(getLocalizedErrorMessage(new Error("English failure"), "ข้อความไทย")).toBe(
      "ข้อความไทย",
    );
  });
});
