import {
    describe,
    expect,
    test,
} from '@jest/globals';

import { Palette } from '@/constants/design';

describe('Design constants', () => {
    test('Palette loads correctly', () => {
        expect(Palette).toBeDefined();
        expect(Palette.background).toBeDefined();
        expect(Palette.brand).toBeDefined();
    });
});