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

export type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

export type HsvColor = {
  hue: number;
  saturation: number;
  value: number;
};

export type HsvChannel = keyof HsvColor;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function rgbToClothingColor({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

export function clothingColorToRgb(value: string): RgbColor | null {
  const normalized = normalizeClothingColor(value);

  if (!normalized) {
    return null;
  }

  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHsv({ red, green, blue }: RgbColor): HsvColor {
  const normalizedRed = clamp(red, 0, 255) / 255;
  const normalizedGreen = clamp(green, 0, 255) / 255;
  const normalizedBlue = clamp(blue, 0, 255) / 255;
  const maximum = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minimum = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const delta = maximum - minimum;
  let hue = 0;

  if (delta !== 0) {
    if (maximum === normalizedRed) {
      hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
    } else if (maximum === normalizedGreen) {
      hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
    } else {
      hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    hue: Math.round(hue),
    saturation: Math.round((maximum === 0 ? 0 : delta / maximum) * 100),
    value: Math.round(maximum * 100),
  };
}

export function clothingColorToHsv(value: string): HsvColor | null {
  const rgb = clothingColorToRgb(value);
  return rgb ? rgbToHsv(rgb) : null;
}

export function hsvToClothingColor({
  hue,
  saturation,
  value,
}: HsvColor): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = clamp(saturation, 0, 100) / 100;
  const normalizedValue = clamp(value, 0, 100) / 100;
  const chroma = normalizedValue * normalizedSaturation;
  const hueSection = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const match = normalizedValue - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSection < 1) {
    red = chroma;
    green = secondary;
  } else if (hueSection < 2) {
    red = secondary;
    green = chroma;
  } else if (hueSection < 3) {
    green = chroma;
    blue = secondary;
  } else if (hueSection < 4) {
    green = secondary;
    blue = chroma;
  } else if (hueSection < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return rgbToClothingColor({
    red: (red + match) * 255,
    green: (green + match) * 255,
    blue: (blue + match) * 255,
  });
}

export function updateHsvChannel(
  color: string,
  channel: HsvChannel,
  nextValue: number,
): string {
  const hsv = clothingColorToHsv(color) ?? {
    hue: 0,
    saturation: 0,
    value: 0,
  };

  return hsvToClothingColor({ ...hsv, [channel]: nextValue });
}

const COLOR_GRID_HUES = [210, 235, 260, 285, 315, 345, 10, 30, 48, 65, 95, 125];
const COLOR_GRID_VALUES = [28, 40, 52, 64, 76, 86, 94, 100];

export const ADVANCED_COLOR_GRID = [
  Array.from({ length: 12 }, (_, index) => {
    const value = 100 - Math.round((index / 11) * 100);
    return hsvToClothingColor({ hue: 0, saturation: 0, value });
  }),
  ...COLOR_GRID_VALUES.map((value) =>
    COLOR_GRID_HUES.map((hue) =>
      hsvToClothingColor({
        hue,
        saturation: value > 90 ? 35 : value > 75 ? 55 : 82,
        value,
      }),
    ),
  ),
];

export const SPECTRUM_COLOR_GRID = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 16 }, (_, column) =>
    hsvToClothingColor({
      hue: (column / 16) * 360,
      saturation: 100 - row * 9,
      value: 100 - row * 10,
    }),
  ),
);

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
