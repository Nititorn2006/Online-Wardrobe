import {
    describe,
    expect,
    test,
} from '@jest/globals';

import {
    formatHexInput,
    isValidHexColor,
} from '../src/features/wardrobe/color-utils';

describe('formatHexInput', () => {
    test('returns empty string when input is empty', () => {
        expect(
            formatHexInput(''),
        ).toBe('');
    });

    test('adds # automatically', () => {
        expect(
            formatHexInput('ffffff'),
        ).toBe('#FFFFFF');
    });

    test('keeps one # correctly', () => {
        expect(
            formatHexInput('#123456'),
        ).toBe('#123456');
    });

    test('removes multiple # characters', () => {
        expect(
            formatHexInput('###123456'),
        ).toBe('#123456');
    });

    test('converts lowercase to uppercase', () => {
        expect(
            formatHexInput('#abcdef'),
        ).toBe('#ABCDEF');
    });

    test('removes invalid characters', () => {
        expect(
            formatHexInput('#12GG34!!AB'),
        ).toBe('#1234AB');
    });

    test('limits input to 6 hex digits', () => {
        expect(
            formatHexInput('#123456789'),
        ).toBe('#123456');
    });

    test('returns empty when input contains only invalid characters', () => {
        expect(
            formatHexInput('GGG!!!'),
        ).toBe('');
    });
});

describe('isValidHexColor', () => {
    test('accepts valid uppercase HEX', () => {
        expect(
            isValidHexColor('#ABCDEF'),
        ).toBe(true);
    });

    test('accepts valid lowercase HEX', () => {
        expect(
            isValidHexColor('#abcdef'),
        ).toBe(true);
    });

    test('accepts numbers', () => {
        expect(
            isValidHexColor('#123456'),
        ).toBe(true);
    });

    test('rejects value without #', () => {
        expect(
            isValidHexColor('ABCDEF'),
        ).toBe(false);
    });

    test('rejects short HEX', () => {
        expect(
            isValidHexColor('#ABC'),
        ).toBe(false);
    });

    test('rejects long HEX', () => {
        expect(
            isValidHexColor('#ABCDEFG'),
        ).toBe(false);
    });

    test('rejects invalid characters', () => {
        expect(
            isValidHexColor('#GGGGGG'),
        ).toBe(false);
    });

    test('rejects empty string', () => {
        expect(
            isValidHexColor(''),
        ).toBe(false);
    });
});