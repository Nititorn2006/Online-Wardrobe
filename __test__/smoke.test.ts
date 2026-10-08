import {
    describe,
    expect,
    test,
} from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const maestroDirectory = join(process.cwd(), '.maestro');
const smokeFlow = readFileSync(join(maestroDirectory, 'smoke.yaml'), 'utf8');
const languageFlow = readFileSync(
    join(maestroDirectory, 'flows', 'change-language.yaml'),
    'utf8',
);

describe('Maestro smoke flow', () => {
    test('runs the language test in the original app session', () => {
        expect(smokeFlow.match(/^- launchApp:/gm)).toHaveLength(1);
        expect(smokeFlow).not.toMatch(/^- stopApp\b/gm);
        expect(smokeFlow).toContain('- runFlow: flows/change-language.yaml');
        expect(languageFlow).not.toMatch(/^- (?:launchApp|stopApp)\b/gm);
    });

    test('switches to Thai across screens and restores English', () => {
        expect(languageFlow).toContain('- tapOn: "ภาษาไทย"');
        expect(languageFlow).toContain('- assertVisible: "หน้าหลัก"');
        expect(languageFlow).toContain(
            '- assertVisible: "ตู้เสื้อผ้าออนไลน์ของคุณ พร้อมสำหรับลุคถัดไปเสมอ"',
        );
        expect(languageFlow).toContain('- tapOn: "English"');
        expect(languageFlow).toContain('- assertVisible: "Home"');
    });
});
