import type {
  ClothingCategory,
  ClothingFormality,
  ClothingItem,
} from '../wardrobe/types';
import type {
  OutfitOccasion,
  OutfitRecommendation,
  OutfitRequest,
} from './types';

const FORMALITY_RANK: Record<ClothingFormality, number> = {
  casual: 0,
  'smart-casual': 1,
  formal: 2,
};

const DRESS_FIRST_OCCASIONS = new Set<OutfitOccasion>([
  'date',
  'party',
  'wedding',
]);

const OUTERWEAR_OCCASIONS = new Set<OutfitOccasion>([
  'work',
  'wedding',
  'travel',
]);

const ACCESSORY_OCCASIONS = new Set<OutfitOccasion>([
  'date',
  'party',
  'wedding',
]);

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function rankItems(
  items: readonly ClothingItem[],
  formality: ClothingFormality,
): ClothingItem[] {
  return [...items].sort((left, right) => {
    const leftDistance = Math.abs(
      FORMALITY_RANK[left.formality] - FORMALITY_RANK[formality],
    );
    const rightDistance = Math.abs(
      FORMALITY_RANK[right.formality] - FORMALITY_RANK[formality],
    );

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    if (left.isFavorite !== right.isFavorite) {
      return left.isFavorite ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  });
}

function pickCategory(
  items: readonly ClothingItem[],
  category: ClothingCategory,
  formality: ClothingFormality,
  seed: number,
  offset: number,
): ClothingItem | undefined {
  const ranked = rankItems(
    items.filter((item) => item.category === category),
    formality,
  );

  if (ranked.length === 0) {
    return undefined;
  }

  const preferredDistance = Math.abs(
    FORMALITY_RANK[ranked[0].formality] - FORMALITY_RANK[formality],
  );
  const preferred = ranked.filter(
    (item) =>
      Math.abs(FORMALITY_RANK[item.formality] - FORMALITY_RANK[formality]) ===
      preferredDistance,
  );

  return preferred[(seed + offset) % preferred.length];
}

function addIfPresent(
  recommendation: ClothingItem[],
  item: ClothingItem | undefined,
) {
  if (item && !recommendation.some((candidate) => candidate.id === item.id)) {
    recommendation.push(item);
  }
}

export function recommendOutfit(
  items: readonly ClothingItem[],
  request: OutfitRequest,
): OutfitRecommendation {
  const seed =
    Math.abs(request.seed) +
    hashString(`${request.plannedFor}:${request.occasion}:${request.formality}`);
  const recommendation: ClothingItem[] = [];

  const dress = pickCategory(items, 'dresses', request.formality, seed, 0);
  const top = pickCategory(items, 'tops', request.formality, seed, 1);
  const bottom = pickCategory(items, 'bottoms', request.formality, seed, 2);
  const hasSeparates = Boolean(top && bottom);
  const preferDress = DRESS_FIRST_OCCASIONS.has(request.occasion);

  if (dress && (preferDress || !hasSeparates)) {
    addIfPresent(recommendation, dress);
  } else {
    addIfPresent(recommendation, top);
    addIfPresent(recommendation, bottom);
  }

  addIfPresent(
    recommendation,
    pickCategory(items, 'shoes', request.formality, seed, 3),
  );

  if (
    OUTERWEAR_OCCASIONS.has(request.occasion) ||
    request.formality === 'formal'
  ) {
    addIfPresent(
      recommendation,
      pickCategory(items, 'outerwear', request.formality, seed, 4),
    );
  }

  if (recommendation.length < 4 && ACCESSORY_OCCASIONS.has(request.occasion)) {
    addIfPresent(
      recommendation,
      pickCategory(items, 'accessories', request.formality, seed, 5),
    );
  }

  const hasCore = recommendation.some((item) => item.category === 'dresses')
    ? recommendation.length >= 2
    : recommendation.some((item) => item.category === 'tops') &&
      recommendation.some((item) => item.category === 'bottoms');

  let missingMessage: string | null = null;

  if (!hasCore) {
    if (!dress && (!top || !bottom)) {
      missingMessage = 'Add a dress, or both a top and bottom, to build a complete look.';
    } else {
      missingMessage = 'Add one more piece to turn this into a complete look.';
    }
  }

  return {
    items: recommendation.slice(0, 4),
    isComplete: hasCore,
    missingMessage,
  };
}
