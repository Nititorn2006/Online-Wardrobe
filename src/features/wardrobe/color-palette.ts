export const COMMON_COLOR_OPTIONS = [
  { name: 'Black', hex: '#292A2A' },
  { name: 'White', hex: '#FAFAF7' },
  { name: 'Gray', hex: '#A5AAA6' },
  { name: 'Cream', hex: '#F3E9D2' },
  { name: 'Beige', hex: '#D8C5A8' },
  { name: 'Khaki', hex: '#C3B091' },
  { name: 'Brown', hex: '#8E634C' },
  { name: 'Navy', hex: '#33445F' },
  { name: 'Blue', hex: '#5E8DBB' },
  { name: 'Light blue', hex: '#A8CBE5' },
  { name: 'Green', hex: '#6E9076' },
  { name: 'Olive', hex: '#80865A' },
  { name: 'Teal', hex: '#4F8C88' },
  { name: 'Red', hex: '#D65A54' },
  { name: 'Maroon', hex: '#7A3E45' },
  { name: 'Orange', hex: '#E88A4D' },
  { name: 'Yellow', hex: '#E6C75A' },
  { name: 'Pink', hex: '#E7A1AD' },
  { name: 'Purple', hex: '#8C72A8' },
  { name: 'Lavender', hex: '#B7A5CC' },
  { name: 'Gold', hex: '#C9A348' },
] as const;

export const EXTENDED_COLOR_SWATCHES = [
  '#FF1744',
  '#F50057',
  '#D500F9',
  '#651FFF',
  '#3D5AFE',
  '#2979FF',
  '#00B0FF',
  '#00E5FF',
  '#1DE9B6',
  '#00E676',
  '#76FF03',
  '#C6FF00',
  '#FFEA00',
  '#FFC400',
  '#FF9100',
  '#FF3D00',
  '#FF8A80',
  '#FF80AB',
  '#EA80FC',
  '#B388FF',
  '#8C9EFF',
  '#82B1FF',
  '#80D8FF',
  '#84FFFF',
  '#A7FFEB',
  '#B9F6CA',
  '#CCFF90',
  '#F4FF81',
  '#FFFF8D',
  '#FFE57F',
  '#FFD180',
  '#FF9E80',
] as const;

export const DEFAULT_CLOTHING_COLOR = COMMON_COLOR_OPTIONS[0].hex;

export function normalizeClothingColor(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function isDarkClothingColor(value: string): boolean {
  const normalized = normalizeClothingColor(value);

  if (!normalized) {
    return false;
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance < 150;
}
