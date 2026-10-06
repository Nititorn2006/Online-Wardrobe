import {
    beforeEach,
    jest,
} from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { i18nInstance as i18n } from '@/i18n';

jest.mock('@react-native-async-storage/async-storage', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mock = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
    return { __esModule: true, default: mock, ...mock };
});

jest.mock('expo-localization', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockJest = require('@jest/globals').jest as typeof jest;
    return {
        getLocales: mockJest.fn(() => [{ languageCode: 'en' }]),
    };
});

beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    await i18n.changeLanguage('en');
});
