export function formatHexInput(value: string) {
    const cleaned = value
        .replace(/#/g, '')
        .replace(/[^0-9a-fA-F]/g, '')
        .slice(0, 6)
        .toUpperCase();

    return cleaned
        ? `#${cleaned}`
        : '';
}

export function isValidHexColor(value: string) {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
}